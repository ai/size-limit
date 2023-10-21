import estimo from 'estimo'

import { getCache, saveCache } from './cache.js'

const EXAMPLE = 'https://unpkg.com/react@18.2.0/umd/react.production.min.js'
const EXAMPLE_TIME = 0.086 // Xiaomi Redmi 2, Snapdragon 410
const URL = 'https://discuss.circleci.com/t/puppeteer-fails-on-circleci/22650'
const JS_FILES = /\.m?js$/i

async function getTime(file, throttling = 1) {
  if (process.env.SIZE_LIMIT_FAKE_TIME) {
    return throttling * parseFloat(process.env.SIZE_LIMIT_FAKE_TIME)
  }
  let value = 0
  for (let i = 0; i < 3; i++) {
    let perf
    try {
      perf = await estimo(file)
    } catch (e) {
      if (process.env.CI) {
        console.warn(
          'Check that you use circleci/node:latest-browsers ' +
            'or buildkite/puppeteer:latest Docker image.\n' +
            `More details: ${URL}\n`
        )
      }
      throw e
    }
    value += perf[0].javaScript / 1000
  }
  return (throttling * value) / 3
}

async function getThrottling() {
  let cache = await getCache()
  if (cache !== false) {
    return cache
  } else {
    let time = await getTime(EXAMPLE)
    let throttling = Math.ceil(EXAMPLE_TIME / time)
    await saveCache(throttling)
    return throttling
  }
}

let throttlingCache
let throttlingCalculating

export async function getRunningTime(file) {
  if (!JS_FILES.test(file)) return 0
  if (throttlingCalculating) await throttlingCalculating
  if (!throttlingCache) {
    throttlingCalculating = getThrottling().then(time => {
      throttlingCache = time
    })
    await throttlingCalculating
  }
  return getTime(file, throttlingCache)
}

export function cleanCache() {
  throttlingCalculating = undefined
  throttlingCache = undefined
}
