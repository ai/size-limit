import { join } from 'path'
import { SizeLimitError } from 'size-limit/size-limit-error'
import { expect, it } from 'vitest'

import filePkg from '../'
const [file] = filePkg

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

it('has name', () => {
  expect(file.name).toBe('@size-limit/file')
})

it('calculates file size with gzip by default', async () => {
  let config = {
    checks: [
      { files: [fixture('a.txt'), fixture('b.txt')] },
      { files: [fixture('a.txt')] },
      { files: [fixture('b.txt')] },
      { files: [fixture('b.txt')] }
    ]
  }
  await Promise.all([
    file.step60(config, config.checks[0]),
    file.step60(config, config.checks[1]),
    file.step60(config, config.checks[2])
  ])
  expect(config).toEqual({
    checks: [
      { files: [fixture('a.txt'), fixture('b.txt')], size: 51 },
      { files: [fixture('a.txt')], size: 22 },
      { files: [fixture('b.txt')], size: 29 },
      { files: [fixture('b.txt')] }
    ]
  })
})

it('calculates file size with gzip by true value', async () => {
  let config = {
    checks: [{ files: [fixture('b.txt')], gzip: true }]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toBe(29)
})

it('calculates file size with brotli by true value and node >= v11.7.0', async () => {
  Object.defineProperty(process, 'version', {
    value: 'v11.7.0'
  })
  let config = {
    checks: [{ brotli: true, files: [fixture('b.txt')] }]
  }
  await file.step60(config, config.checks[0])

  expect(config.checks[0].size).toBe(17)
})

it('calculates file size with brotli by true value and node < v11.7.0', async () => {
  Object.defineProperty(process, 'version', {
    value: 'v11.6.0'
  })

  let config = {
    checks: [{ brotli: true, files: [fixture('b.txt')] }]
  }

  let err
  try {
    await file.step60(config, config.checks[0])
  } catch (e) {
    err = e
  }

  expect(err).toEqual(new SizeLimitError('brotliUnsupported'))
})

it('uses webpack bundle if available', async () => {
  let config = {
    checks: [{ bundles: [fixture('a.txt')], files: [fixture('b.txt')] }]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toBe(22)
})

it('calculates file size without gzip', async () => {
  let config = {
    checks: [{ files: [fixture('b.txt')], gzip: false }]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toBe(144)
})
