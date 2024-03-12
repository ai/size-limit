import bytes from 'bytes-iec'
import { globby } from 'globby'
import buildJiti from 'jiti'
import { lilconfig } from 'lilconfig'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SizeLimitError } from './size-limit-error.js'

const require = createRequire(import.meta.url)

const jiti = buildJiti(fileURLToPath(import.meta.url), { interopDefault: true })

let OPTIONS = {
  brotli: 'file',
  compareWith: 'webpack',
  config: ['webpack', 'esbuild'],
  disableModuleConcatenation: 'webpack',
  entry: 'webpack',
  gzip: 'file',
  hidePassed: false,
  highlightLess: false,
  ignore: ['webpack', 'esbuild'],
  import: ['webpack', 'esbuild'],
  limit: true,
  modifyEsbuildConfig: 'esbuild',
  modifyWebpackConfig: 'webpack',
  module: true,
  name: true,
  path: true,
  running: 'time',
  uiReports: 'webpack',
  webpack: 'webpack'
}

function isStrings(value) {
  if (!Array.isArray(value)) return false
  return value.every(i => typeof i === 'string')
}

function isStringsOrUndefined(value) {
  let type = typeof value
  return type === 'undefined' || type === 'string' || isStrings(value)
}

function checkChecks(plugins, checks) {
  if (!Array.isArray(checks)) {
    throw new SizeLimitError('noArrayConfig')
  }
  if (checks.length === 0) {
    throw new SizeLimitError('emptyConfig')
  }
  for (let check of checks) {
    if (typeof check !== 'object') {
      throw new SizeLimitError('noObjectCheck')
    }
    if (!isStringsOrUndefined(check.path)) {
      throw new SizeLimitError('pathNotString')
    }
    if (!isStringsOrUndefined(check.entry)) {
      throw new SizeLimitError('entryNotString')
    }
    for (let opt in check) {
      let available = OPTIONS[opt]
      if (typeof available === 'string') {
        if (!plugins.has(available)) {
          throw new SizeLimitError('pluginlessConfig', opt, available)
        }
      } else if (Array.isArray(available)) {
        if (available.every(i => !plugins.has(i))) {
          throw new SizeLimitError('multiPluginlessConfig', opt, ...available)
        }
      } else if (available !== true) {
        throw new SizeLimitError('unknownOption', opt)
      }
    }
  }
}

function toAbsolute(file, cwd) {
  return isAbsolute(file) ? file : join(cwd, file)
}

function toName(files, cwd) {
  return files.map(i => (i.startsWith(cwd) ? relative(cwd, i) : i)).join(', ')
}

/**
 * Dynamically imports a module from a given file path
 * and returns its default export.
 *
 * @param {string} filePath - The path to the module file to be imported.
 * @returns {Promise<any>} A promise that resolves with the default export of the module.
 */
const dynamicImport = async filePath => (await import(filePath)).default

/**
 * Loads a TypeScript file from a given file path using the
 * {@linkcode jiti} function. This loader function simplifies the
 * process of dynamically importing TypeScript modules at runtime,
 * offering a way to execute or import TypeScript files directly
 * without pre-compilation.
 *
 * @param {string} filePath - The path to the TypeScript file to be loaded.
 * @returns {any} The module exports from the loaded TypeScript file.
 */
const tsLoader = filePath => jiti(filePath)

export default async function getConfig(plugins, process, args, pkg) {
  let config = {
    cwd: process.cwd()
  }
  if (args.why) {
    config.project = pkg.packageJson.name
    config.why = args.why
  }

  if (args.compareWith) {
    config.compareWith = toAbsolute(args.compareWith, process.cwd())
  }

  if (args.saveBundle) {
    config.saveBundle = toAbsolute(args.saveBundle, process.cwd())
  }
  if (args.cleanDir) {
    config.cleanDir = args.cleanDir
  }
  if (args.hidePassed) {
    config.hidePassed = args.hidePassed
  }
  if (args.highlightLess) {
    config.highlightLess = args.highlightLess
  }

  if (args.files.length > 0) {
    config.checks = [{ files: args.files }]
  } else {
    let explorer = lilconfig('size-limit', {
      loaders: {
        '.cjs': dynamicImport,
        '.cts': tsLoader,
        '.js': dynamicImport,
        '.mjs': dynamicImport,
        '.mts': tsLoader,
        '.ts': tsLoader
      },
      searchPlaces: [
        'package.json',
        '.size-limit.json',
        '.size-limit',
        '.size-limit.js',
        '.size-limit.mjs',
        '.size-limit.cjs',
        '.size-limit.ts',
        '.size-limit.mts',
        '.size-limit.cts'
      ]
    })
    let result = await explorer.search(process.cwd())

    if (result === null) throw new SizeLimitError('noConfig')
    checkChecks(plugins, result.config)

    config.configPath = relative(process.cwd(), result.filepath)
    config.cwd = dirname(result.filepath)
    config.checks = await Promise.all(
      result.config.map(async check => {
        let processed = { ...check }
        if (check.path) {
          processed.files = await globby(check.path, { cwd: config.cwd })
        } else if (!check.entry) {
          if (pkg.packageJson.main) {
            processed.files = [
              require.resolve(join(dirname(pkg.path), pkg.packageJson.main))
            ]
          } else {
            processed.files = [join(dirname(pkg.path), 'index.js')]
          }
        }
        return processed
      })
    )
  }

  let peer = Object.keys(pkg.packageJson.peerDependencies || {})
  for (let check of config.checks) {
    if (peer.length > 0) check.ignore = peer.concat(check.ignore || [])
    if (check.entry && !Array.isArray(check.entry)) check.entry = [check.entry]
    if (!check.name) check.name = toName(check.entry || check.files, config.cwd)
    if (args.limit) check.limit = args.limit
    if (check.limit) {
      if (/ ?ms/i.test(check.limit)) {
        check.timeLimit = parseFloat(check.limit) / 1000
      } else if (/ ?s/i.test(check.limit)) {
        check.timeLimit = parseFloat(check.limit)
      } else {
        check.sizeLimit = bytes.parse(check.limit)
      }
      if (check.timeLimit && !plugins.has('time')) {
        throw new SizeLimitError('timeWithoutPlugin')
      }
    }
    if (config.highlightLess) check.highlightLess = true
    if (/\sB$|\dB$/.test(check.limit)) check.highlightLess = true
    if (check.files) {
      check.files = check.files.map(i => toAbsolute(i, config.cwd))
    }
    if (check.config) check.config = toAbsolute(check.config, config.cwd)
    if (typeof check.import === 'string') {
      check.import = {
        [check.files[0]]: check.import
      }
    }
    if (check.import) {
      let imports = {}
      for (let i in check.import) {
        if (peer.includes(i)) {
          check.ignore = check.ignore.filter(j => j !== i)
          imports[require.resolve(i, config.cwd)] = check.import[i]
        } else {
          imports[toAbsolute(i, config.cwd)] = check.import[i]
        }
      }
      check.import = imports
    }
  }

  return config
}
