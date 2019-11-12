let { join, dirname } = require('path')
let { promisify } = require('util')
let fs = require('fs')

let writeFile = promisify(fs.writeFile)
let readFile = promisify(fs.readFile)
let mkdir = promisify(fs.mkdir)

const VERSION = 1
const CACHE = join(__dirname, '..', '.cache', 'size-limit', 'cache.json')

async function createCacheDir () {
  let sizeLimitCache = dirname(CACHE)
  let npmCache = dirname(sizeLimitCache)
  if (!fs.existsSync(npmCache)) await mkdir(npmCache)
  if (!fs.existsSync(sizeLimitCache)) await mkdir(sizeLimitCache)
}

async function getCache () {
  if (!fs.existsSync(CACHE)) return false
  try {
    let cache = JSON.parse(await readFile(CACHE))
    if (typeof cache !== 'object' || cache.version !== VERSION) cache = false
    return cache.throttling || false
  } catch (e) {
    return false
  }
}

async function saveCache (throttling) {
  if (!fs.existsSync(CACHE)) await createCacheDir()
  await writeFile(CACHE, JSON.stringify({ throttling, version: VERSION }))
}

module.exports = { saveCache, getCache }
