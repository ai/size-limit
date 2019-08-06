let readPkgUp = require('read-pkg-up')

let createReporter = require('./create-reporter')
let createHelp = require('./create-help')

function list (obj) {
  return typeof obj === 'object' ? Object.keys(obj) : []
}

function loadModules (pkg) {
  if (!pkg || !pkg.package) return []
  return list(pkg.package.dependencies)
    .concat(list(pkg.package.devDependencies))
    .filter(i => i.startsWith('@size-limit/'))
    .reduce((modules, i) => modules.concat(require(i)), [])
}

function parseArgs (modules, help, argv) {
  let isWebpack = modules.some(i => i.name === '@size-limit/webpack')
  let ignore = { '--help': true, '--version': true, '--json': true }
  let args = { }
  for (let i = 2; i < argv.length; i++) {
    let arg = argv[i]
    if (arg === '--limit') {
      args.limit = argv[++i]
    } else if (arg === '--save-build') {
      args.saveBuild = argv[++i]
    } else if (arg === '--why') {
      if (!isWebpack) throw help.errors.webpackArg('--why')
      args.why = true
    } else if (arg === '--webpack-config') {
      if (!isWebpack) throw help.errors.webpackArg('--webpack-config')
      args.webpackConfig = argv[++i]
    } else if (!ignore[arg]) {
      throw help.errors.unknownArg(arg)
    }
  }
  return args
}

async function findConfig () {
  // TODO
}

async function calc () {
  // TODO
}

module.exports = async process => {
  function hasArg (arg) {
    return process.argv.some(i => i === arg)
  }
  let reporter = createReporter(process, hasArg('--json'))
  let help = createHelp(process)

  try {
    if (hasArg('--version')) {
      return help.showVersion()
    }

    let pkg = await readPkgUp({ cwd: process.cwd() })
    let modules = loadModules(pkg)

    if (hasArg('--help')) {
      return help.showHelp(modules)
    }

    if (!pkg || !pkg.package) {
      throw help.errors.noPackage()
    }

    let args = parseArgs(modules, help, process.argv)
    if (modules.length === 0) {
      help.showMigrationGuide(pkg)
      return process.exit(1)
    }
    let config = await findConfig(args, pkg.path)

    let results = await calc(modules, config)
    reporter.results(results)
  } catch (e) {
    reporter.error(e)
    process.exit(1)
  }
}
