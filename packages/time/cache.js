import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const VERSION = 1
const CACHE = join(__dirname, '..', '.cache', 'size-limit', 'cache.json')

export async function createCacheDir() {
  let sizeLimitCache = dirname(CACHE)
  let npmCache = dirname(sizeLimitCache)
  if (!existsSync(npmCache)) await mkdir(npmCache)
  if (!existsSync(sizeLimitCache)) await mkdir(sizeLimitCache)
}

export async function getCache() {
  if (!existsSync(CACHE)) return false
  try {
    let cache = JSON.parse(await readFile(CACHE))
    if (typeof cache !== 'object' || cache.version !== VERSION) cache = false
    return cache.throttling || false
  } catch {
    return false
  }
}

export async function saveCache(throttling) {
  if (!existsSync(CACHE)) await createCacheDir()
  await writeFile(CACHE, JSON.stringify({ throttling, version: VERSION }))
}
