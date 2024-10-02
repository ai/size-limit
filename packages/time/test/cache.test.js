import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeAll, expect, it } from 'vitest'

import { getCache, saveCache } from '../cache'

const CACHE = join(__dirname, '..', '..', '.cache')

beforeAll(() => rm(CACHE, { force: true, recursive: true }))
afterEach(() => rm(CACHE, { force: true, recursive: true }))

it('returns false by default', async () => {
  expect(await getCache()).toBe(false)
})

it('writes cache', async () => {
  await saveCache(10)
  expect(await getCache()).toBe(10)
})

it('checks version', async () => {
  await saveCache(10)
  let cache = join(__dirname, '..', '..', '.cache', 'size-limit', 'cache.json')
  await writeFile(cache, '{"version":0,"throttling":10}')
  expect(await getCache()).toBe(false)
})

it('works on broken JSON', async () => {
  await saveCache(10)
  let cache = join(__dirname, '..', '..', '.cache', 'size-limit', 'cache.json')
  await writeFile(cache, '{')
  expect(await getCache()).toBe(false)
})
