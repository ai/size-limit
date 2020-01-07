let { join } = require('path')
let SizeLimitError = require('size-limit/size-limit-error')

let [file] = require('../')

function fixture (name) {
  return join(__dirname, 'fixtures', name)
}

it('has name', () => {
  expect(file.name).toEqual('@size-limit/file')
})

it('calculates file size with gzip by default', async () => {
  let config = {
    checks: [
      { path: [fixture('a.txt'), fixture('b.txt')] },
      { path: [fixture('a.txt')] },
      { path: [fixture('b.txt')] },
      { path: [fixture('b.txt')] }
    ]
  }
  await Promise.all([
    file.step60(config, config.checks[0]),
    file.step60(config, config.checks[1]),
    file.step60(config, config.checks[2])
  ])
  expect(config).toEqual({
    checks: [
      { path: [fixture('a.txt'), fixture('b.txt')], size: 51 },
      { path: [fixture('a.txt')], size: 22 },
      { path: [fixture('b.txt')], size: 29 },
      { path: [fixture('b.txt')] }
    ]
  })
})

it('calculates file size with gzip by true value', async () => {
  let config = {
    checks: [
      { path: [fixture('b.txt')], gzip: true }
    ]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toEqual(29)
})

it('calculates file size with brotli by true value and node >= v11.7.0',
  async () => {
    Object.defineProperty(process, 'version', {
      value: 'v11.7.0'
    })
    let config = {
      checks: [
        { path: [fixture('b.txt')], brotli: true }
      ]
    }
    await file.step60(config, config.checks[0])

    expect(config.checks[0].size).toEqual(17)
  })

it('calculates file size with brotli by true value and node < v11.7.0',
  async () => {
    Object.defineProperty(process, 'version', {
      value: 'v11.6.0'
    })

    let config = {
      checks: [
        { path: [fixture('b.txt')], brotli: true }
      ]
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
    checks: [
      { path: [fixture('b.txt')], bundles: [fixture('a.txt')] }
    ]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toEqual(22)
})

it('calculates file size without gzip', async () => {
  let config = {
    checks: [
      { path: [fixture('b.txt')], gzip: false }
    ]
  }
  await file.step60(config, config.checks[0])
  expect(config.checks[0].size).toEqual(144)
})
