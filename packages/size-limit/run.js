let readPkgUp = require('read-pkg-up')

let createReporter = require('./create-reporter')
let createHelp = require('./create-help')

function list (obj) {
  return typeof obj === 'object' ? Object.keys(obj) : []
}

function loadModules (pkg) {
  if (!pkg || !pkg.package) return []
  console.log(pkg)
  return list(pkg.package.dependencies)
    .concat(list(pkg.package.devDependencies))
    .filter(i => i.startsWith('@size-limit/'))
    .reduce((modules, i) => modules.concat(require(i)), [])
}

function parseArgs () {
  // TODO
  return { }
}

async function findConfig () {
  // TODO
}

async function run () {
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

    if (modules.length === 0) {
      help.showMigrationGuide(process)
      return process.exit(1)
    }

    let args = parseArgs(modules, process.argv)
    let config = await findConfig(args, pkg.path)

    let results = await run(modules, config)
    reporter.results(results)
  } catch (e) {
    reporter.error(e)
    process.exit(1)
  }
}
