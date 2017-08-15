'use strict'

const Compression = require('compression-webpack-plugin')
const Analyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const MemoryFS = require('memory-fs')
const gzipSize = require('gzip-size')
const webpack = require('webpack')
const Uglify = require('uglifyjs-webpack-plugin')
const path = require('path')
const fs = require('fs')
const os = require('os')

const promisify = require('./promisify')

const WEBPACK_EMPTY_PROJECT = 293

function projectName (opts, files) {
  if (opts.bundle) {
    return `${ opts.bundle }.js`
  } else if (files.length === 1) {
    return path.basename(files[0])
  } else {
    return `${ path.basename(path.dirname(files[0])) }.js`
  }
}

function getConfig (files, opts) {
  const config = {
    entry: files,
    output: {
      filename: projectName(opts, files)
    },
    module: {
      rules: [
        {
          test: /\.(eot|woff|woff2|ttf|otf|svg|png|jpg|jpeg|jp2|jpx|jxr|gif|webp|mp4|mp3|ogg|pdf|html|ico)$/, // eslint-disable-line
          use: 'file-loader'
        },
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                minimize: true,
                modules: false
              }
            }
          ]
        },
        {
          test: /\.module\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                minimize: true,
                modules: true
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new Uglify({ sourceMap: false })
    ]
  }

  config.plugins.push(new Compression({ asset: '[path].gz' }))

  if (opts.analyzer) {
    config.output.path = path.join(os.tmpdir(), `size-limit-${ Date.now() }`)
    config.plugins.push(new Analyzer({
      openAnalyzer: opts.analyzer === 'server',
      analyzerMode: opts.analyzer,
      defaultSizes: 'gzip'
    }))
  }

  return config
}

function runWebpack (config, opts) {
  return promisify(done => {
    const compiler = webpack(config)
    if (!opts.analyzer) {
      compiler.outputFileSystem = new MemoryFS()
    }
    compiler.run(done)
  })
}

/**
 * Return size of project files with all dependencies and after UglifyJS
 * and gzip.
 *
 * @param {string|string[]} files Files to get size.
 * @param {object} [opts] Extra options.
 * @param {"server"|"static"|false} [opts.analyzer=false] Show package
 *                                                        content in browser.
 * @param {true|false} [opts.webpack=true] Pack files by webpack.
 * @param {string} [opts.bundle] Bundle name for Analyzer mode.
 *
 * @return {Promise} Promise with size of files
 *
 * @example
 * const getSize = require('size-limit')
 *
 * const index = path.join(__dirname, 'index.js')
 * const extra = path.join(__dirname, 'extra.js')
 *
 * getSize([index, extra]).then(size => {
 *   if (size > 1 * 1024 * 1024) {
 *     console.error('Project become bigger than 1MB')
 *   }
 * })
 */
function getSize (files, opts) {
  if (typeof files === 'string') files = [files]
  if (!opts) opts = { }

  if (opts.webpack === false) {
    return Promise.all(files.map(file => {
      return promisify(done => fs.readFile(file, 'utf8', done)).then(bytes => {
        return promisify(done => gzipSize(bytes, done))
      })
    })).then(sizes => {
      return sizes.reduce((all, size) => all + size, 0)
    })
  } else {
    return runWebpack(getConfig(files, opts), opts).then(stats => {
      if (stats.hasErrors()) {
        throw new Error(stats.toString('errors-only'))
      }

      const name = `${ stats.compilation.outputOptions.filename }.gz`
      const assets = stats.toJson().assets
      const size = assets.find(i => i.name === name).size

      return size - WEBPACK_EMPTY_PROJECT
    })
  }
}

module.exports = getSize
