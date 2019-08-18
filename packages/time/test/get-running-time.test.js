let { promisify } = require('util')
let { join } = require('path')
let rimraf = promisify(require('rimraf'))

let getRunningTime = require('../get-running-time')
let { saveCache, getCache } = require('../cache')

const EXAMPLE = require.resolve('react/umd/react.production.min.js')

afterEach(async () => {
  getRunningTime.cleanCache()
  await rimraf(join(__dirname, '..', '..', '.cache'))
})

it('calculates running time', async () => {
  let runTime = await getRunningTime(EXAMPLE)
  expect(runTime).toBeGreaterThan(0.04)
  expect(runTime).toBeLessThan(0.2)
})

it('uses cache', async () => {
  await getRunningTime(EXAMPLE)
  let throttling = await getCache()
  await saveCache(throttling * 100)
  let runTime1 = await getRunningTime(EXAMPLE)
  expect(runTime1).toBeGreaterThan(0.04)
  getRunningTime.cleanCache()
  let runTime2 = await getRunningTime(EXAMPLE)
  expect(runTime2).toBeGreaterThan(4)
})

it('ignores non-JS files', async () => {
  let runTime = await getRunningTime('/a.jpg')
  expect(runTime).toEqual(0)
})
