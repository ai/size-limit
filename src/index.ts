import OptimizeCss from 'optimize-css-assets-webpack-plugin'
import Compression from 'compression-webpack-plugin'
import { BundleAnalyzerPlugin as Analyzer } from 'webpack-bundle-analyzer'
import gzipSize from 'gzip-size'
import webpack from 'webpack'
import path from 'path'
import util from 'util'
import del from 'del'
import os from 'os'
import fs from 'fs'
import getRunningTime from './get-running-time'
import { SizeLimitNodeOptions, SizeStats } from './interfaces'

let readFile = util.promisify(fs.readFile)

const WEBPACK_EMPTY_PROJECT_PARSED = 962
const WEBPACK_EMPTY_PROJECT_GZIP = 461

const STATIC =
  /\.(eot|woff2?|ttf|otf|svg|png|jpe?g|gif|webp|mp4|mp3|ogg|pdf|html|ico|md)$/

function projectName (opts: SizeLimitNodeOptions, files: string[]) {
  if (opts.bundle) {
    return `${ opts.bundle }.js`
  } else if (files.length === 1) {
    return path.basename(files[0])
  } else {
    return `${ path.basename(path.dirname(files[0])) }.js`
  }
}

function getBundlePath (opts: SizeLimitNodeOptions) {
  if (opts.output) {
    if (path.isAbsolute(opts.output)) {
      return opts.output
    }

    return path.join(process.cwd(), opts.output)
  }

  return path.join(os.tmpdir(), `size-limit-${ Date.now() }`)
}

function getConfig (files: string[], opts: SizeLimitNodeOptions) {
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

  let config: webpack.Configuration = {
    entry: files,
    output: {
      filename: projectName(opts, files),
      path: getBundlePath(opts)
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
    config.plugins!.push(new Compression())
  }

  const ignore = opts.ignore
  if (ignore && ignore.length !== 0) {
    config.externals = (context, request, callback) => {
      if (ignore.some(i => request.startsWith(i))) {
        callback(null, 'root a')
      } else {
        callback(undefined, undefined)
      }
    }
  }

  if (opts.analyzer) {
    config.plugins!.push(new Analyzer({
      openAnalyzer: opts.analyzer === 'server',
      analyzerMode: opts.analyzer,
      defaultSizes: opts.gzip === false ? 'parsed' : 'gzip'
    }))
  }

  return config
}

function runWebpack (config: webpack.Configuration): Promise<webpack.Stats> {
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

function sumSize (s1: SizeStats, s2: SizeStats): SizeStats {
  let result: SizeStats = {
    parsed: s1.parsed + s2.parsed
  }
  if (s1.gzip && s2.gzip) {
    result.gzip = s1.gzip + s2.gzip
  }
  if (s1.running && s2.running) {
    result.running = s1.running + s2.running
  }
  if (s1.loading && s2.loading) {
    result.loading = s1.loading + s2.loading
  }
  return result
}

type WebpackEntries = Record<string, webpack.Stats.ChunkGroup>;

function filterEntries (
  obj: WebpackEntries,
  filter?: string[] | string
): WebpackEntries {
  if (!filter) {
    return obj
  } else {
    if (!Array.isArray(filter)) filter = [filter]
    let result: WebpackEntries = { }
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

function extractSize (
  stat: webpack.Stats.ToJsonOutput,
  opts: SizeLimitNodeOptions
): SizeStats {
  let entries = filterEntries(stat.entrypoints!, opts.entry)

  let assets: string[] = []
  Object.keys(entries).forEach(i => {
    assets = assets.concat(entries[i].assets)
  })

  return assets.reduce((sizeInfo, assetName) => {
    let parsedAsset = stat.assets!.find(({ name }) => name === assetName)
    let gzipAsset = stat.assets!
      .find(({ name }) => name === `${ assetName }.gz`)
    return {
      parsed: sizeInfo.parsed + (parsedAsset ? parsedAsset.size : 0),
      gzip: sizeInfo.gzip + (gzipAsset ? gzipAsset.size : 0)
    }
  }, { parsed: 0, gzip: 0 })
}

function getLoadingTime (size: number) {
  if (size === 0) return 0
  let time = size / (50 * 1024)
  if (time < 0.01) time = 0.01
  return time
}

getSize([] as never[]).catch(() => {})

/**
 * Return size of project files with all dependencies and after UglifyJS
 * and gzip.
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
export default async function getSize (
  files: string | string[],
  opts: SizeLimitNodeOptions = { }
): Promise<SizeStats> {
  if (typeof files === 'string') files = [files]

  if (opts.webpack === false) {
    let sizes = await Promise.all(files.map(async file => {
      let bytes = await readFile(file, 'utf8')
      let result: SizeStats = { parsed: bytes.length }
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
    let size: SizeStats, running
    try {
      let stats = await runWebpack(config)
      if (opts.running !== false) running = await getRunningTime(output)

      if (stats.hasErrors()) {
        throw new Error(stats.toString('errors-only'))
      }

      const subStats: webpack.Stats[] = (stats as any).stats
      if (opts.config && subStats) {
        size = subStats
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

    let result: SizeStats = {
      parsed: size.parsed - WEBPACK_EMPTY_PROJECT_PARSED
    }
    if (opts.running !== false) result.running = running
    if (opts.config || opts.gzip === false) {
      result.loading = getLoadingTime(result.parsed)
    } else {
      result.gzip = size.gzip! - WEBPACK_EMPTY_PROJECT_GZIP
      result.loading = getLoadingTime(result.gzip)
    }
    return result
  }
}
