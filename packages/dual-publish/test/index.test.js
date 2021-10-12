let SizeLimitError = require('size-limit/size-limit-error')
let { join } = require('path')

let [dualPublish] = require('../')

jest.mock('child_process', () => ({
  spawn(cmd, args, opts) {
    return {
      stderr: {
        on(type, cb) {
          if (type === 'data' && opts.cwd === '') cb(' ERROR  Replace require')
        }
      },
      on(type, cb) {
        if (type === 'close') cb(opts.cwd === '' ? 1 : 0)
        return this
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
    cwd: fixture(),
    checks: [{ files: [fixture('index.js')] }]
  }
  await dualPublish.all10(config)
  expect(config).toEqual({
    cwd: fixture(),
    checks: [{ files: [fixture('dual-publish-tmp/index.js')] }]
  })
})

it('throws dual-publish error', async () => {
  let config = {
    cwd: '',
    checks: []
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
