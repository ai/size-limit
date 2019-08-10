let readPkgUp = require('read-pkg-up')

let SizeLimitError = require('./size-limit-error')
let createReporter = require('./create-reporter')
let loadPlugins = require('./load-plugins')
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
    let plugins = loadPlugins(pkg)

    if (hasArg('--help')) {
      return help.showHelp(plugins)
    }

    if (!pkg || !pkg.package) {
      throw new SizeLimitError('noPackage')
    }

    let args = parseArgs(plugins, process.argv)
    if (plugins.isEmpty) {
      help.showMigrationGuide(pkg)
      return process.exit(1)
    }
    let config = await getConfig(plugins, process, args, pkg)

    await calc(plugins, config)
    reporter.results(plugins, config)
    if (config.failed) process.exit(1)
  } catch (e) {
    reporter.error(e)
    process.exit(1)
  }
}
