let readPkgUp = require('read-pkg-up')

let SizeLimitError = require('./size-limit-error')
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
      throw new SizeLimitError('noPackage')
    }

    let args = parseArgs(modules, process.argv)
    if (modules.isEmpty) {
      help.showMigrationGuide(pkg)
      return process.exit(1)
    }
    let config = await getConfig(modules, process, args, pkg)

    await calc(modules, config)
    reporter.results(modules, config)
    if (config.failed) process.exit(1)
  } catch (e) {
    reporter.error(e)
    process.exit(1)
  }
}
