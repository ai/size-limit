let { join } = require('path')

let [file] = require('../')

function fixture (name) {
  return join(__dirname, 'fixtures', name)
}

it('has name', () => {
  expect(file.name).toEqual('@size-limit/file')
})

it('calculates file size', async () => {
  let config = {
    checks: [
      { path: [fixture('a.txt'), fixture('b.txt')] },
      { path: [fixture('a.txt')] }
    ]
  }
  await file.step50([file], config, config.checks[0])
  expect(config).toEqual({
    checks: [
      { path: [fixture('a.txt'), fixture('b.txt')], size: 8 },
      { path: [fixture('a.txt')] }
    ]
  })
})
