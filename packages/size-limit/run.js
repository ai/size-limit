let readPkgUp = require('read-pkg-up')

let createReporter = require('./create-reporter')
let loadModules = require('./load-modules')
let createHelp = require('./create-help')
let getConfig = require('./get-config')
let parseArgs = require('./parse-args')
let calc = require('./calc')

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
    let config = await getConfig(args, pkg.path)

    let results = await calc(modules, config)
    reporter.results(results)
  } catch (e) {
    reporter.error(e)
    process.exit(1)
  }
}
