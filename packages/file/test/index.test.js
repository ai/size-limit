import { join } from 'node:path'
import { expect, it } from 'vitest'

import filePkg from '../index.js'
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
      { files: [fixture('a.txt'), fixture('b.txt')], size: 23 },
      { files: [fixture('a.txt')], size: 6 },
      { files: [fixture('b.txt')], size: 17 },
      { files: [fixture('b.txt')] }
    ]
  })
})

it('calculates file size with compression by true value', async () => {
  let config = {
    checks: [{ brotli: true, files: [fixture('b.txt')] }]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toBe(17)
})

it('calculates file size with gzip by true value', async () => {
  let config = {
    checks: [{ files: [fixture('b.txt')], gzip: true }]
  }
  await file.step60(config, config.checks[0])

  expect(config.checks[0].size).toBe(29)
})

it('uses webpack bundle if available', async () => {
  let config = {
    checks: [{ bundles: [fixture('a.txt')], files: [fixture('b.txt')] }]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toBe(6)
})

it('calculates file size without compression', async () => {
  let config = {
    checks: [{ brotli: false, files: [fixture('b.txt')] }]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toBe(144)
})
