'use strict'

const Compression = require('compression-webpack-plugin')
const Analyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const MemoryFS = require('memory-fs')
const webpack = require('webpack')
const Babili = require('babili-webpack-plugin')
const path = require('path')

const promisify = require('./promisify')

const WEBPACK_EMPTY_PROJECT = 293

function projectName (files) {
  if (files.length === 1) {
    return path.basename(files[0])
  } else {
    return `${ path.basename(path.dirname(files[0])) }.js`
  }
}

function getConfig (files, opts) {
  const config = {
    entry: files,
    output: {
      filename: projectName(files)
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      })
    ]
  }

  if (opts.minifier === 'babili') {
    config.plugins.push(new Babili())
  } else {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      sourceMap: false,
      mangle: {
        screw_ie8: true
      },
      compress: {
        screw_ie8: true
      },
      compressor: {
        warnings: false
      },
      output: {
        comments: false
      }
    }))
  }

  config.plugins.push(new Compression({
    asset: '[path]'
  }))

  if (opts.analyzer) {
    config.plugins.push(new Analyzer({
      openAnalyzer: opts.analyzer === 'server',
      analyzerMode: opts.analyzer,
      defaultSizes: 'gzip'
    }))
  }

  return config
}

function runWebpack (config) {
  return promisify(done => {
    const compiler = webpack(config)
    compiler.outputFileSystem = new MemoryFS()
    compiler.run(done)
  })
}

/**
 * Return size of project files with all dependencies and after UglifyJS
 * and gzip.
 *
 * @param {string|string[]} files Files to get size.
 * @param {object} [opts] Extra options.
 * @param {"server"|"static"|false} [opts.analyzer] Show package content
 *                                                  in browser.
 * @param {"uglifyjs"|"babili"} [opts.minifier="uglifyjs"] Minifier.
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

  return runWebpack(getConfig(files, opts)).then(stats => {
    if (stats.hasErrors()) {
      throw new Error(stats.toString('errors-only'))
    }

    const name = stats.compilation.outputOptions.filename
    const assets = stats.toJson().assets
    const size = assets.find(i => i.name === name).size

    return size - WEBPACK_EMPTY_PROJECT
  })
}

module.exports = getSize
