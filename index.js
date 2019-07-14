let { promisify } = require('util')
let escapeRegexp = require('escape-string-regexp')
let OptimizeCss = require('optimize-css-assets-webpack-plugin')
let Compression = require('compression-webpack-plugin')
let Analyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
let readFile = promisify(require('fs').readFile)
let gzipSize = require('gzip-size')
let webpack = require('webpack')
let path = require('path')
let del = require('del')
let os = require('os')

let getRunningTime = require('./get-running-time')

const WEBPACK_EMPTY_PROJECT_PARSED = 962
const WEBPACK_EMPTY_PROJECT_GZIP = 461

const STATIC =
  /\.(eot|woff2?|ttf|otf|svg|png|jpe?g|gif|webp|mp4|mp3|ogg|pdf|html|ico|md)$/

function projectName (opts, files) {
  if (opts.bundle) {
    return `${ opts.bundle }.js`
  } else if (files.length === 1) {
    return path.basename(files[0])
  } else {
    return `${ path.basename(path.dirname(files[0])) }.js`
  }
}

function getBundlePath (opts) {
  if (opts.output) {
    if (path.isAbsolute(opts.output)) {
      return opts.output
    }

    return path.join(process.cwd(), opts.output)
  }

  return path.join(os.tmpdir(), `size-limit-${ Date.now() }`)
}

function getConfig (files, opts) {
  if (opts.config) {
    let file = opts.config
    if (!path.isAbsolute(file)) file = path.join(process.cwd(), opts.config)
    let config = require(file)

    let resolveModulesPaths = [
      path.join(process.cwd(), 'node_modules')
    ]
    if (!config.resolveLoader) config.resolveLoader = { }
    if (!config.resolve) config.resolve = { }
    config.resolveLoader.modules = resolveModulesPaths
    config.resolve.modules = resolveModulesPaths

    return config
  }

  let config = {
    entry: files,
    output: {
      filename: projectName(opts, files),
      path: getBundlePath(opts)
    },
    optimization: {
      concatenateModules: !opts.disableModuleConcatenation
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
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.module\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new OptimizeCss()
    ]
  }

  if (opts.gzip !== false) {
    config.plugins.push(new Compression())
  }

  if (opts.ignore && opts.ignore.length !== 0) {
    let escaped = opts.ignore.map(i => escapeRegexp(i))
    let ignorePattern = new RegExp(`^(${ escaped.join('|') })($|/)`)
    config.externals = (context, request, callback) => {
      if (ignorePattern.test(request)) {
        callback(null, 'root a')
      } else {
        callback()
      }
    }
  }

  if (opts.analyzer) {
    config.plugins.push(new Analyzer({
      openAnalyzer: opts.analyzer === 'server',
      analyzerMode: opts.analyzer,
      defaultSizes: opts.gzip === false ? 'parsed' : 'gzip'
    }))
  }

  return config
}

function runWebpack (config) {
  return new Promise((resolve, reject) => {
    let compiler = webpack(config)
    compiler.run((err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

function sumSize (s1, s2) {
  let result = { }
  for (let i in s1) {
    result[i] = s1[i] + s2[i]
  }
  return result
}

function filterEntries (obj, filter) {
  if (!filter) {
    return obj
  } else {
    if (!Array.isArray(filter)) filter = [filter]
    let result = { }
    for (let i of filter) {
      if (!obj[i]) {
        throw new Error(
          `Cannot find entry point ${ i } from ${ Object.keys(obj).join(', ') }`
        )
      }
      result[i] = obj[i]
    }
    return result
  }
}

function extractSize (stat, opts) {
  let entries = filterEntries(stat.entrypoints, opts.entry)

  let assets = []
  Object.keys(entries).forEach(i => {
    assets = assets.concat(entries[i].assets)
  })

  return assets.reduce((sizeInfo, assetName) => {
    let parsedAsset = stat.assets.find(({ name }) => name === assetName)
    let gzipAsset = stat.assets.find(({ name }) => name === `${ assetName }.gz`)
    return {
      parsed: sizeInfo.parsed + (parsedAsset ? parsedAsset.size : 0),
      gzip: sizeInfo.gzip + (gzipAsset ? gzipAsset.size : 0)
    }
  }, { parsed: 0, gzip: 0 })
}

function getLoadingTime (size) {
  if (size === 0) return 0
  let time = size / (50 * 1024)
  if (time < 0.01) time = 0.01
  return time
}

/**
 * Return size of project files with all dependencies and after UglifyJS
 * and gzip.
 *
 * @param {string|string[]|undefined} files Files to get size.
 * @param {object} [opts] Extra options.
 * @param {"server"|"static"|false} [opts.analyzer=false] Show package
 *                                                        content in browser.
 * @param {boolean} [opts.webpack=true] Pack files by webpack.
 * @param {boolean} [opts.running=true] Calculate running time.
 * @param {boolean} [opts.gzip=true] Compress files by gzip.
 * @param {string} [opts.config] A path to custom webpack config.
 * @param {string} [opts.bundle] Bundle name for Analyzer mode.
 * @param {string} [opts.output] A path for output bundle.
 * @param {boolean} [opts.disableModuleConcatenation=false] Module concatenation
 *                                                          optimization
 * @param {string[]} [opts.ignore] Dependencies to be ignored.
 * @param {string|string[]} [opts.entry] Webpack entry to check the size.
 *
 * @return {Promise} Promise with parsed and gzip size of files
 *
 * @example
 * const getSize = require('size-limit')
 *
 * const index = path.join(__dirname, 'index.js')
 * const extra = path.join(__dirname, 'extra.js')
 *
 * getSize([index, extra]).then(size => {
 *   if (size.gzip > 1 * 1024 * 1024) {
 *     console.error('Project become bigger than 1MB')
 *   }
 * })
 */
async function getSize (files, opts = { }) {
  if (typeof files === 'string') files = [files]
  if ((!files || files.length === 0) && !opts.config) {
    throw new Error('Pass a files or webpack config to Size Limit')
  }

  if (opts.webpack === false) {
    let sizes = await Promise.all(files.map(async file => {
      let bytes = await readFile(file, 'utf8')
      let result = { parsed: bytes.length }
      if (opts.running !== false) result.running = await getRunningTime(file)
      if (opts.gzip === false) {
        result.loading = getLoadingTime(result.parsed)
      } else {
        result.gzip = await gzipSize(bytes)
        result.loading = getLoadingTime(result.gzip)
      }
      return result
    }))
    return sizes.reduce(sumSize)
  } else {
    let config = getConfig(files, opts)
    let output = path.join(
      config.output.path || process.cwd(), config.output.filename)
    let size, running
    try {
      let stats = await runWebpack(config)
      if (opts.running !== false) running = await getRunningTime(output)

      if (stats.hasErrors()) {
        throw new Error(stats.toString('errors-only'))
      }

      if (opts.config && stats.stats) {
        size = stats.stats
          .map(stat => extractSize(stat.toJson(), opts))
          .reduce(sumSize)
      } else {
        size = extractSize(stats.toJson(), opts)
      }
    } finally {
      if (config.output.path && !opts.output) {
        await del(config.output.path, { force: true })
      }
    }

    let result = { parsed: size.parsed - WEBPACK_EMPTY_PROJECT_PARSED }
    if (opts.running !== false) result.running = running
    if (opts.config || opts.gzip === false) {
      result.loading = getLoadingTime(result.parsed)
    } else {
      result.gzip = size.gzip - WEBPACK_EMPTY_PROJECT_GZIP
      result.loading = getLoadingTime(result.gzip)
    }
    return result
  }
}

module.exports = getSize
