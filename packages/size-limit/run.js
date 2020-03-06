let readPkgUp = require('read-pkg-up')
let ora = require('ora')

let SizeLimitError = require('./size-limit-error')
let createReporter = require('./create-reporter')
let loadPlugins = require('./load-plugins')
let createHelp = require('./create-help')
let getConfig = require('./get-config')
let parseArgs = require('./parse-args')
let debug = require('./debug')
let calc = require('./calc')

module.exports = async process => {
  function hasArg (arg) {
    return process.argv.some(i => i === arg)
  }
  let reporter = createReporter(process, hasArg('--json'))
  let help = createHelp(process)
  let config, args

  try {
    if (hasArg('--version')) {
      return help.showVersion()
    }

    let pkg = await readPkgUp({ cwd: process.cwd() })
    let plugins = loadPlugins(pkg)

    if (hasArg('--help')) {
      return help.showHelp(plugins)
    }

    if (!pkg || !pkg.packageJson) {
      throw new SizeLimitError('noPackage')
    }

    args = parseArgs(plugins, process.argv)

    if (plugins.isEmpty) {
      help.showMigrationGuide(pkg)
      return process.exit(1)
    }

    config = await getConfig(plugins, process, args, pkg)

    await calc(plugins, config, ora)

    debug.results(process, args, config)
    reporter.results(plugins, config)
    if (config.failed && !args.why) process.exit(1)
  } catch (e) {
    debug.error(process, args, config)
    reporter.error(e)
    process.exit(1)
  }
}
