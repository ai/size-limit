let { promisify } = require('util')
let { join } = require('path')
let rimraf = promisify(require('rimraf'))

let getRunningTime = require('../get-running-time')
let { saveCache, getCache } = require('../cache')

const EXAMPLE = require.resolve('nanoid/index.browser.js')

afterEach(async () => {
  delete process.env.SIZE_LIMIT_FAKE_TIME
  getRunningTime.cleanCache()
  await rimraf(join(__dirname, '..', '..', '.cache'))
})

it('calculates running time', async () => {
  let runTime = await getRunningTime(EXAMPLE)
  expect(runTime).toBeGreaterThan(0.04)
  expect(runTime).toBeLessThan(0.2)
})

it('uses cache', async () => {
  process.env.SIZE_LIMIT_FAKE_TIME = 1
  expect(await getRunningTime(EXAMPLE)).toEqual(1)

  let throttling = await getCache()
  await saveCache(throttling * 100)
  expect(await getRunningTime(EXAMPLE)).toEqual(1)

  getRunningTime.cleanCache()
  expect(await getRunningTime(EXAMPLE)).toEqual(100)
})

it('ignores non-JS files', async () => {
  expect(await getRunningTime('/a.jpg')).toEqual(0)
})
