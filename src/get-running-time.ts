import { join, basename, dirname } from 'path'
import makeDir from 'make-dir'
import estimo from 'estimo'
import util from 'util'
import fs from 'fs'

let writeFile = util.promisify(fs.writeFile)
let readFile = util.promisify(fs.readFile)

const VERSION = 1
const CACHE = join(__dirname, '..', '.cache', 'size-limit', 'cache.json')
const EXAMPLE = require.resolve('react/umd/react.production.min.js')
const EXAMPLE_TIME = 0.086 // Xiaomi Redmi 2, Snapdragon 410
const URL = 'https://discuss.circleci.com/t/puppeteer-fails-on-circleci/22650'

interface CacheData {
  version: number;
  throttling: number;
}

async function getCache () {
  try {
    if (fs.existsSync(CACHE)) {
      let cache: CacheData = JSON.parse(await readFile(CACHE, 'utf-8'))
      if (typeof cache === 'object' && cache.version === VERSION) {
        return cache
      }
    }
    return false
  } catch (e) {
    return false
  }
}

async function saveCache (throttling: number) {
  if (basename(dirname(__dirname)) === 'node_modules') {
    await makeDir(dirname(CACHE))
    await writeFile(CACHE, JSON.stringify({ throttling, version: VERSION }))
  }
}

async function getTime (file: string, throttling = 1) {
  let value = 0
  for (let i = 0; i < 3; i++) {
    let perf
    try {
      perf = await estimo(file)
    } catch (e) {
      if (process.env.CIRCLECI) {
        process.stdout.write(
          `Check that you use circleci/node:latest-browsers Docker image.\n` +
          `More details: ${ URL }\n`
        )
      }
      throw e
    }
    value += (perf.javaScript + perf.javaScriptCompile) / 1000
  }
  return throttling * value / 3
}

async function getThrottling () {
  let cache = await getCache()
  if (cache) {
    return cache.throttling
  } else {
    let time = await getTime(EXAMPLE)
    let throttling = Math.round(EXAMPLE_TIME / time)
    await saveCache(throttling)
    return throttling
  }
}

export default async function getRunningTime (file: string) {
  if (process.env.FAKE_SIZE_LIMIT_RUNNING) {
    return parseFloat(process.env.FAKE_SIZE_LIMIT_RUNNING)
  }
  return getTime(file, await getThrottling())
}
