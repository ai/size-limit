let { promisify } = require('util')
let { join } = require('path')
let rimraf = promisify(require('rimraf'))

let getRunningTime = require('../get-running-time')
let { saveCache, getCache } = require('../cache')

const EXAMPLE = require.resolve('react/umd/react.production.min.js')

afterEach(async () => {
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
  let runTime = await getRunningTime(EXAMPLE)
  expect(runTime).toBeGreaterThan(4)
})
