import { join } from 'node:path'
import SizeLimitError from 'size-limit/size-limit-error'
import { expect, it, vi } from 'vitest'

import plugins from '../'
let [dualPublish] = plugins

vi.mock('child_process', () => ({
  spawn(cmd, args, opts) {
    return {
      on(type, cb) {
        if (type === 'close') cb(opts.cwd === '' ? 1 : 0)
        return this
      },
      stderr: {
        on(type, cb) {
          if (type === 'data' && opts.cwd === '') cb(' ERROR  Replace require')
        }
      }
    }
  }
}))

function fixture(name = '') {
  return join(__dirname, 'fixtures', name)
}

it('has name', () => {
  expect(dualPublish.name).toBe('@size-limit/dual-publish')
})

it('calculates file size with gzip by default', async () => {
  let config = {
    checks: [{ files: [fixture('index.js')] }],
    cwd: fixture()
  }
  await dualPublish.all10(config)
  expect(config).toEqual({
    checks: [{ files: [fixture('dual-publish-tmp/index.js')] }],
    cwd: fixture()
  })
})

it('throws dual-publish error', async () => {
  let config = {
    checks: [],
    cwd: ''
  }

  let err
  try {
    await dualPublish.all10(config)
  } catch (e) {
    err = e
  }
  expect(err).toEqual(
    new SizeLimitError('cmdError', 'dual-publish', 'Replace require')
  )
})
