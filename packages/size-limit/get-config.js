let { isAbsolute, dirname, join, relative } = require('path')
let { cosmiconfig } = require('cosmiconfig')
let globby = require('globby')
let bytes = require('bytes')

let SizeLimitError = require('./size-limit-error')

let OPTIONS = {
  name: true,
  path: true,
  limit: true,
  module: true,
  entry: 'webpack',
  config: 'webpack',
  webpack: 'webpack',
  ignore: 'webpack',
  gzip: 'webpack',
  running: 'time',
  disableModuleConcatenation: 'webpack'
}

function isStrings (value) {
  if (!Array.isArray(value)) return false
  return value.every(i => typeof i === 'string')
}

function isStringsOrUndefined (value) {
  let type = typeof value
  return type === 'undefined' || type === 'string' || isStrings(value)
}

function checkChecks (plugins, checks) {
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
      } else if (available !== true) {
        throw new SizeLimitError('unknownOption', opt)
      }
    }
  }
}

function makeAbsolute (file, cwd) {
  return isAbsolute(file) ? file : join(cwd, file)
}

function toName (files, cwd) {
  return files.map(i => i.startsWith(cwd) ? relative(cwd, i) : i).join(', ')
}

module.exports = async function getConfig (plugins, process, args, pkg) {
  let config = { }
  if (args.why) {
    config.project = pkg.packageJson.name
    config.why = args.why
  }
  if (args.saveBundle) {
    config.saveBundle = makeAbsolute(args.saveBundle, process.cwd())
  }

  let cwd
  if (args.files.length > 0) {
    cwd = process.cwd()
    config.checks = [{ path: args.files }]
  } else {
    let explorer = cosmiconfig('size-limit', {
      searchPlaces: [
        'package.json',
        '.size-limit.json',
        '.size-limit',
        '.size-limit.js'
      ]
    })
    let result = await explorer.search(process.cwd())

    if (result === null) throw new SizeLimitError('noConfig')
    checkChecks(plugins, result.config)

    config.configPath = relative(process.cwd(), result.filepath)
    cwd = dirname(result.filepath)
    config.checks = await Promise.all(result.config.map(async check => {
      if (check.path) {
        check.path = await globby(check.path, { cwd: dirname(result.filepath) })
      } else if (!check.entry) {
        if (pkg.packageJson.main) {
          check.path = [
            require.resolve(join(dirname(pkg.path), pkg.packageJson.main))
          ]
        } else {
          check.path = [join(dirname(pkg.path), 'index.js')]
        }
      }
      return check
    }))
  }

  let peer = Object.keys(pkg.packageJson.peerDependencies || { })
  for (let check of config.checks) {
    if (peer.length > 0) check.ignore = peer.concat(check.ignore || [])
    if (check.entry && !Array.isArray(check.entry)) check.entry = [check.entry]
    if (!check.name) check.name = toName(check.entry || check.path, cwd)
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
    if (check.path) check.path = check.path.map(i => makeAbsolute(i, cwd))
    if (check.config) check.config = makeAbsolute(check.config, cwd)
  }

  return config
}
