let { writeFile } = require('fs').promises
let { join } = require('path')
let rm = require('size-limit/rm')

let { saveCache, getCache } = require('../cache')

const CACHE = join(__dirname, '..', '..', '.cache')

beforeAll(() => rm(CACHE))
afterEach(() => rm(CACHE))

it('returns false by default', async () => {
  expect(await getCache()).toBe(false)
})

it('writes cache', async () => {
  await saveCache(10)
  expect(await getCache()).toEqual(10)
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
