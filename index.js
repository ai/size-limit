const escapeRegexp = require('escape-string-regexp')
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

const WEBPACK_EMPTY_PROJECT = {
  minified: 577,
  gziped: 310
}

const STATIC =
  /\.(eot|woff2?|ttf|otf|svg|png|jpe?g|gif|webp|mp4|mp3|ogg|pdf|html|ico)$/

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
  if (opts.config) {
    let config
    if (path.isAbsolute(opts.config)) {
      config = require(opts.config)
    } else {
      config = require(path.join(process.cwd(), opts.config))
    }

    const resolveModulesPaths = [
      path.join(process.cwd(), 'node_modules')
    ]
    config.resolveLoader = { modules: resolveModulesPaths }
    config.resolve = { modules: resolveModulesPaths }

    return config
  }

  const config = {
    entry: files,
    output: {
      filename: projectName(opts, files)
    },
    module: {
      rules: [
        {
          test: STATIC,
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
                minimize: true
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

  if (opts.gzip !== false) {
    config.plugins.push(new Compression({ asset: '[path].gz' }))
  }

  if (opts.ignore) {
    const escaped = opts.ignore.map(i => escapeRegexp(i))
    const regexp = new RegExp(`^(${ escaped.join('|') })($|/)`)
    config.plugins.push(new webpack.IgnorePlugin(regexp))
  }

  if (opts.analyzer) {
    config.output.path = path.join(os.tmpdir(), `size-limit-${ Date.now() }`)
    config.plugins.push(new Analyzer({
      openAnalyzer: opts.analyzer === 'server',
      analyzerMode: opts.analyzer,
      defaultSizes: opts.gzip === false ? 'parsed' : 'gzip'
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

function extractSize (stat, opts) {
  let name = stat.compilation.outputOptions.filename
  name += opts.config || opts.gzip === false ? '' : '.gz'
  const assets = stat.toJson().assets
  return assets.find(i => i.name === name).size
}

/**
 * Return size of project files with all dependencies and after UglifyJS
 * and gzip.
 *
 * @param {string|string[]} files Files to get size.
 * @param {object} [opts] Extra options.
 * @param {"server"|"static"|false} [opts.analyzer=false] Show package
 *                                                        content in browser.
 * @param {boolean} [opts.webpack=true] Pack files by webpack.
 * @param {boolean} [opts.gzip=true] Compress files by gzip.
 * @param {string} [opts.config] A path to custom webpack config.
 * @param {string} [opts.bundle] Bundle name for Analyzer mode.
 * @param {string[]} [opts.ignore] Dependencies to be ignored.
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
        if (opts.gzip === false) {
          return bytes.length
        } else {
          return gzipSize(bytes)
        }
      })
    })).then(sizes => {
      return sizes.reduce((all, size) => all + size, 0)
    })
  } else {
    return runWebpack(getConfig(files, opts), opts).then(stats => {
      if (stats.hasErrors()) {
        throw new Error(stats.toString('errors-only'))
      }

      let size
      if (opts.config && stats.stats) {
        size = stats.stats.reduce((pre, cur) => pre + extractSize(cur, opts), 0)
      } else {
        size = extractSize(stats, opts)
      }

      let emptySize
      if (opts.config || opts.gzip === false) {
        emptySize = WEBPACK_EMPTY_PROJECT.minified
      } else {
        emptySize = WEBPACK_EMPTY_PROJECT.gziped
      }

      return size - emptySize
    })
  }
}

module.exports = getSize
