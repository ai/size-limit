let { join } = require('path')
let rm = require('size-limit/rm')

let getRunningTime = require('../get-running-time')
let { getCache, saveCache } = require('../cache')

const EXAMPLE = join(__dirname, '../node_modules/nanoid/index.browser.js')

jest.setTimeout(15000)

afterEach(async () => {
  delete process.env.SIZE_LIMIT_FAKE_TIME
  getRunningTime.cleanCache()
  await rm(join(__dirname, '..', '..', '.cache'))
})

it('calculates running time', async () => {
  let runTime = await getRunningTime(EXAMPLE)
  expect(runTime).toBeGreaterThan(0.01)
  expect(runTime).toBeLessThan(0.5)
})

it('uses cache', async () => {
  process.env.SIZE_LIMIT_FAKE_TIME = 1
  expect(await getRunningTime(EXAMPLE)).toBe(1)

  let throttling = await getCache()
  await saveCache(throttling * 100)
  expect(await getRunningTime(EXAMPLE)).toBe(1)

  getRunningTime.cleanCache()
  expect(await getRunningTime(EXAMPLE)).toBe(100)
})

it('ignores non-JS files', async () => {
  expect(await getRunningTime('/a.jpg')).toBe(0)
})

it('works in parallel', async () => {
  process.env.SIZE_LIMIT_FAKE_TIME = 1
  let times = await Promise.all([
    getRunningTime(EXAMPLE),
    getRunningTime(EXAMPLE),
    getRunningTime(EXAMPLE),
    getRunningTime(EXAMPLE)
  ])
  expect(times).toHaveLength(4)
})
