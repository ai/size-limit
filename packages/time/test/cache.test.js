import { writeFile } from 'fs/promises'
import { join } from 'path'
import rm from 'size-limit/rm'
import { afterEach, beforeAll, expect, it } from 'vitest'

import { getCache, saveCache } from '../cache'

const CACHE = join(__dirname, '..', '..', '.cache')

beforeAll(() => rm(CACHE))
afterEach(() => rm(CACHE))

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
