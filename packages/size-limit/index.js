import calc from './calc.js'
import { Plugins } from './load-plugins.js'

export { processImport } from './process-import.js'
export { SizeLimitError } from './size-limit-error.js'

/**
 * Run Size Limit and return the result
 *
 * @param  {Function[]} plugins   The list of plugins like `@size-limit/time`
 * @param  {string[]|object} files Path to files or internal config
 * @return {Promise<object>}     Project size
 */
export default async function (plugins, files) {
  let pluginList = new Plugins(plugins.reduce((all, i) => all.concat(i), []))
  if (Array.isArray(files)) {
    files = {
      checks: [{ files }]
    }
  }

  await calc(pluginList, files, false)

  return files.checks.map(i => {
    let value = {}
    for (let prop of ['size', 'time', 'runTime', 'loadTime']) {
      if (typeof i[prop] !== 'undefined') value[prop] = i[prop]
    }
    return value
  })
}
