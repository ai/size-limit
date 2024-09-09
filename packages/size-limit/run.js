import chokidar from 'chokidar'
import { createSpinner } from 'nanospinner'
import { resolve } from 'node:path'

import calc from './calc.js'
import createHelp from './create-help.js'
import createReporter from './create-reporter.js'
import debug from './debug.js'
import getConfig from './get-config.js'
import loadPlugins from './load-plugins.js'
import parseArgs from './parse-args.js'
import readPkgUp from './read-pkg-up.js'
import { SizeLimitError } from './size-limit-error.js'

/* c8 ignore next 10 */
function throttle(fn) {
  let next, running
  return () => {
    clearTimeout(next)
    next = setTimeout(async () => {
      await running
      running = fn()
    }, 200)
  }
}

async function findPlugins(parentPkg) {
  let plugins = await loadPlugins(parentPkg)

  if (!parentPkg || !plugins.isEmpty) return plugins
  if (parentPkg.packageJson && parentPkg.packageJson.sizeLimitRoot) {
    return plugins
  }

  let cwd = resolve(parentPkg.path, '..', '..')
  let pkg = await readPkgUp(cwd)

  return findPlugins(pkg)
}

export default async process => {
  function hasArg(arg) {
    return process.argv.includes(arg)
  }
  let isJsonOutput = hasArg('--json')
  let isSilentMode = hasArg('--silent')
  let reporter = createReporter(process, isJsonOutput, isSilentMode)
  let help = createHelp(process)
  let args, config

  try {
    if (hasArg('--version')) {
      return help.showVersion()
    }

    let pkg = await readPkgUp(process.cwd())
    let plugins = await findPlugins(pkg)

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

    let calcAndShow = async () => {
      let outputFunc = isJsonOutput || isSilentMode ? null : createSpinner
      await calc(plugins, config, outputFunc)
      debug.results(process, args, config)
      reporter.results(plugins, config)
    }

    await calcAndShow()

    /* c8 ignore next 6 */
    if (hasArg('--watch')) {
      let watcher = chokidar.watch(['**/*'], {
        ignored: '**/node_modules/**'
      })
      watcher.on('change', throttle(calcAndShow))
    }

    if ((config.failed || config.missed) && !args.why) process.exit(1)
  } catch (e) {
    debug.error(process, args, config)
    reporter.error(e)
    process.exit(1)
  }
}
