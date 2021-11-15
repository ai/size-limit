let { join } = require('path')
let rm = require('size-limit/rm')

let [webpackCss] = require('../')
let [webpack] = require('../../webpack')
let [file] = require('../../file')

const DIST = join(process.cwd(), 'dist')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

async function run(config) {
  try {
    await webpackCss.before(config, config.checks[0])
    await webpack.before(config)
    await webpack.step20(config, config.checks[0])
    await webpack.step40(config, config.checks[0])
    await file.step60(config, config.checks[0])
    await webpack.step61(config, config.checks[0])
  } finally {
    await webpack.finally(config, config.checks[0])
  }
}
afterEach(async () => {
  await rm(DIST)
  jest.clearAllMocks()
})

it('supports non-JS require', async () => {
  let config = {
    checks: [{ files: [fixture('nonjs.js')] }]
  }
  await run(config)
  expect(config.checks[0].size).toBeGreaterThan(1450)
  expect(config.checks[0].size).toBeLessThan(2300)
})
