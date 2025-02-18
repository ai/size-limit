import { SizeLimitError } from 'size-limit'

import { getRunningTime } from './get-running-time.js'

const SLOW_3G = 50 * 1024

async function sum(array, fn) {
  return (await Promise.all(array.map(fn))).reduce((all, i) => all + i, 0)
}

function getLoadingTime(size, networkSpeed) {
  if (size === 0) return 0
  let time = size / networkSpeed
  if (time < 0.01) time = 0.01
  return time
}

export default [
  {
    name: '@size-limit/time',
    async step80(config, check) {
      if (typeof check.size === 'undefined') {
        throw new SizeLimitError('missedPlugin', 'file')
      }
      let networkSpeed = (check.time && check.time.networkSpeed) || SLOW_3G
      let latency = (check.time && check.time.latency) || 0
      check.loadTime = getLoadingTime(check.size, networkSpeed) + latency
      if (check.running !== false) {
        let files = check.bundles || check.files
        check.runTime = await sum(files, i => getRunningTime(i))
        check.totalTime = check.runTime + check.loadTime
      } else {
        check.totalTime = check.loadTime
      }
    },
    wait80: 'Running JS in headless Chrome'
  }
]
