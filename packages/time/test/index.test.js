import { SizeLimitError } from 'size-limit'
import { beforeEach, expect, it, vi } from 'vitest'

import { getRunningTime } from '../get-running-time.js'
import timePkg from '../index.js'
const [time] = timePkg

vi.mock('../get-running-time')

beforeEach(() => {
  getRunningTime.mockReset()
  getRunningTime.mockImplementation(() => 10)
})

it('has name', () => {
  expect(time.name).toBe('@size-limit/time')
})

it('calculates time to download and run', async () => {
  let config = {
    checks: [
      { bundles: ['/tmp/a.js'], files: ['/a'], size: 1024 * 1024 },
      { files: ['/b'], size: 1024 * 1024 }
    ]
  }
  await time.step80(config, config.checks[0])
  expect(getRunningTime).toHaveBeenCalledWith('/tmp/a.js')
  expect(config).toEqual({
    checks: [
      {
        bundles: ['/tmp/a.js'],
        files: ['/a'],
        loadTime: 20.48,
        runTime: 10,
        size: 1024 * 1024,
        totalTime: 30.48
      },
      { files: ['/b'], size: 1024 * 1024 }
    ]
  })
})

it('avoids run on request', async () => {
  let config = {
    checks: [
      { bundle: '/tmp/a.js', files: ['/a'], running: false, size: 1024 * 1024 }
    ]
  }
  await time.step80(config, config.checks[0])
  expect(config.checks[0]).toEqual({
    bundle: '/tmp/a.js',
    files: ['/a'],
    loadTime: 20.48,
    running: false,
    size: 1024 * 1024,
    totalTime: 20.48
  })
})

it('is compatible with file plugin', async () => {
  let config = {
    checks: [{ files: ['/a'], size: 1024 * 1024 }]
  }
  await time.step80(config, config.checks[0])
  expect(getRunningTime).toHaveBeenCalledWith('/a')
  expect(config.checks[0].runTime).toBe(10)
})

it('uses 1 ms for download as minimum', async () => {
  let config = {
    checks: [{ files: ['/a'], size: 1 }]
  }
  await time.step80(config, config.checks[0])
  expect(config.checks[0].loadTime).toBe(0.01)
})

it('uses 0 ms for download for 0 bytes', async () => {
  let config = {
    checks: [{ files: ['/a'], size: 0 }]
  }
  await time.step80(config, config.checks[0])
  expect(config.checks[0].loadTime).toBe(0)
})

it('throws an error on missed size', async () => {
  let config = {
    checks: [{ files: ['/a'] }]
  }
  let err
  try {
    await time.step80(config, config.checks[0])
  } catch (e) {
    err = e
  }
  expect(err).toEqual(new SizeLimitError('missedPlugin', 'file'))
})

it('uses provided network speed for calculating loading time', async () => {
  let config = {
    checks: [
      { running: false, size: 1024 * 1024, time: { networkSpeed: 100 * 1024 } }
    ]
  }

  await time.step80(config, config.checks[0])
  expect(config.checks[0].loadTime).toBe(
    config.checks[0].size / config.checks[0].time.networkSpeed
  )
})

it('uses provided latency to loading time', async () => {
  let size = 1024 * 1024
  let config = {
    checks: [
      { running: false, size },
      { running: false, size, time: { latency: 8 } }
    ]
  }

  await time.step80(config, config.checks[0])
  await time.step80(config, config.checks[1])
  expect(config.checks[1].loadTime).toBe(
    config.checks[0].loadTime + config.checks[1].time.latency
  )
})

it('uses provided network speed and latency for calculating loading time', async () => {
  let config = {
    checks: [
      {
        running: false,
        size: 1024 * 1024,
        time: { latency: 0.1984, networkSpeed: 100 * 1024 }
      }
    ]
  }

  await time.step80(config, config.checks[0])
  expect(config.checks[0].loadTime).toBe(
    config.checks[0].size / config.checks[0].time.networkSpeed +
      config.checks[0].time.latency
  )
})
