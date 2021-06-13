let { writeFile, readFile, mkdir } = require('fs').promises
let { join, dirname } = require('path')
let { existsSync } = require('fs')

const VERSION = 1
const CACHE = join(__dirname, '..', '.cache', 'size-limit', 'cache.json')

async function createCacheDir() {
  let sizeLimitCache = dirname(CACHE)
  let npmCache = dirname(sizeLimitCache)
  if (!existsSync(npmCache)) await mkdir(npmCache)
  if (!existsSync(sizeLimitCache)) await mkdir(sizeLimitCache)
}

async function getCache() {
  if (!existsSync(CACHE)) return false
  try {
    let cache = JSON.parse(await readFile(CACHE))
    if (typeof cache !== 'object' || cache.version !== VERSION) cache = false
    return cache.throttling || false
  } catch {
    return false
  }
}

async function saveCache(throttling) {
  if (!existsSync(CACHE)) await createCacheDir()
  await writeFile(CACHE, JSON.stringify({ throttling, version: VERSION }))
}

module.exports = { saveCache, getCache }
