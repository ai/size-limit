let SizeLimitError = require('size-limit/size-limit-error')

let getRunningTime = require('../get-running-time')
let [time] = require('../')

jest.mock('../get-running-time')

beforeEach(() => {
  getRunningTime.mockReset()
  getRunningTime.mockImplementation(() => 10)
})

it('has name', () => {
  expect(time.name).toEqual('@size-limit/time')
})

it('calculates time to download and run', async () => {
  let config = {
    checks: [
      { path: ['/a'], bundle: '/tmp/a.js', size: 1024 * 1024 },
      { path: ['/b'], size: 1024 * 1024 }
    ]
  }
  await time.step80([time], config, config.checks[0])
  expect(getRunningTime).toHaveBeenCalledWith('/tmp/a.js')
  expect(config).toEqual({
    checks: [
      {
        path: ['/a'],
        size: 1024 * 1024,
        bundle: '/tmp/a.js',
        runTime: 10,
        loadTime: 20.48
      },
      { path: ['/b'], size: 1024 * 1024 }
    ]
  })
})

it('avoids run on request', async () => {
  let config = {
    checks: [
      { path: ['/a'], bundle: '/tmp/a.js', size: 1024 * 1024, running: false }
    ]
  }
  await time.step80([time], config, config.checks[0])
  expect(config.checks[0]).toEqual({
    path: ['/a'],
    size: 1024 * 1024,
    bundle: '/tmp/a.js',
    loadTime: 20.48,
    running: false
  })
})

it('is compatible with file module', async () => {
  let config = {
    checks: [
      { path: ['/a'], size: 1024 * 1024 }
    ]
  }
  await time.step80([time], config, config.checks[0])
  expect(getRunningTime).toHaveBeenCalledWith('/a')
  expect(config.checks[0].runTime).toEqual(10)
})

it('uses 1 ms for download as minimum', async () => {
  let config = {
    checks: [
      { path: ['/a'], size: 1 }
    ]
  }
  await time.step80([time], config, config.checks[0])
  expect(config.checks[0].loadTime).toEqual(0.01)
})

it('uses 0 ms for download for 0 bytes', async () => {
  let config = {
    checks: [
      { path: ['/a'], size: 0 }
    ]
  }
  await time.step80([time], config, config.checks[0])
  expect(config.checks[0].loadTime).toEqual(0)
})

it('throws an error on missed size', async () => {
  let config = {
    checks: [
      { path: ['/a'] }
    ]
  }
  let err
  try {
    await time.step80([time], config, config.checks[0])
  } catch (e) {
    err = e
  }
  expect(err).toEqual(new SizeLimitError('missedModule', 'webpack', 'file'))
})
