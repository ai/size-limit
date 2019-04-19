let { join, basename, dirname } = require('path')
let { existsSync } = require('fs')
let makeDir = require('make-dir')
let estimo = require('estimo')
let util = require('util')

let writeFile = util.promisify(require('fs').writeFile)
let readFile = util.promisify(require('fs').readFile)

let VERSION = 1
let CACHE = join(__dirname, '..', '.cache', 'size-limit', 'cache.json')
let EXAMPLE = require.resolve('react/umd/react.production.min.js')
let EXAMPLE_TIME = 0.086 // Xiaomi Redmi 2, Snapdragon 410

async function getCache () {
  try {
    let cache = false
    if (existsSync(CACHE)) {
      cache = JSON.parse(await readFile(CACHE, 'utf-8'))
      if (typeof cache !== 'object' || cache.version !== VERSION) cache = false
    }
    return cache
  } catch (e) {
    return false
  }
}

async function saveCache (throttling) {
  if (basename(dirname(__dirname)) === 'node_modules') {
    await makeDir(dirname(CACHE))
    await writeFile(CACHE, JSON.stringify({ throttling, version: VERSION }))
  }
}

async function getTime (file, throttling) {
  let opts = !throttling ? undefined : [
    '--set-cpu-throttling-rate',
    '--rate',
    throttling
  ]
  let value = 0
  for (let i = 0; i < 3; i++) {
    let perf = await estimo(file, opts)
    value += (perf.javaScript + perf.javaScriptCompile) / 1000
  }
  return value / 3
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

module.exports = async function getRunningTime (file) {
  return getTime(file, await getThrottling())
}
