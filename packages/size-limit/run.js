let readPkgUp = require('read-pkg-up')
let ora = require('ora')
let chokidar = require('chokidar')

let SizeLimitError = require('./size-limit-error')
let createReporter = require('./create-reporter')
let loadPlugins = require('./load-plugins')
let createHelp = require('./create-help')
let getConfig = require('./get-config')
let parseArgs = require('./parse-args')
let debug = require('./debug')
let calc = require('./calc')

function throttle (fn) {
  let next, running
  return () => {
    clearTimeout(next)
    next = setTimeout(async () => {
      await running
      running = fn()
    }, 200)
  }
}

module.exports = async process => {
  function hasArg (arg) {
    return process.argv.some(i => i === arg)
  }
  let reporter = createReporter(process, hasArg('--json'))
  let help = createHelp(process)
  let config, args

  async function mainCalc (plugins, configObj, parsedArgs) {
    await calc(plugins, configObj, ora)
    debug.results(process, parsedArgs, configObj)
    reporter.results(plugins, configObj)
  }

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

    await mainCalc(plugins, config, args)

    if (hasArg('--watch')) {
      let watcher = chokidar.watch([
        '**/*.js',
        'package.json'
      ], {
        ignored: '**/node_modules/**'
      })
      watcher.on('change', throttle(() => mainCalc(plugins, config, args)))
    }

    if (config.failed && !args.why) process.exit(1)
  } catch (e) {
    debug.error(process, args, config)
    reporter.error(e)
    process.exit(1)
  }
}
