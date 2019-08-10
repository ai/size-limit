let { join } = require('path')

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
    file.step60([file], config, config.checks[0]),
    file.step60([file], config, config.checks[1]),
    file.step60([file], config, config.checks[2])
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
  await file.step60([file], config, config.checks[0])
  expect(config.checks[0].size).toEqual(29)
})

it('uses webpack bundle if available', async () => {
  let config = {
    checks: [
      { path: [fixture('b.txt')], bundle: fixture('a.txt') }
    ]
  }
  await file.step60([file], config, config.checks[0])
  expect(config.checks[0].size).toEqual(22)
})

it('calculates file size without gzip', async () => {
  let config = {
    checks: [
      { path: [fixture('b.txt')], gzip: false }
    ]
  }
  await file.step60([file], config, config.checks[0])
  expect(config.checks[0].size).toEqual(144)
})
