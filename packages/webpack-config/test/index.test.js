const { join } = require('path')
const { existsSync } = require('fs')
const rimraf = require('rimraf')
let SizeLimitError = require('size-limit/size-limit-error')

let [webpackConfig] = require('../')
let [webpack] = require('../../webpack')
let [file] = require('../../file')

async function run (config) {
  try {
    await webpack.step20(config, config.checks[0])
    await webpackConfig.step21(config, config.checks[0])
    await webpack.step40(config, config.checks[0])
    await file.step60(config, config.checks[0])
    await webpack.step61(config, config.checks[0])
  } finally {
    await webpack.finally(config, config.checks[0])
  }
}

function fixture (name) {
  return join(__dirname, 'fixtures', name)
}

beforeEach(() => {
  rimraf.sync(fixture('*.temp'))
})

afterEach(() => {
  rimraf.sync(fixture('*.temp'))
})

it('extends existing webpack configuration', async () => {
  let generatedTempFile = fixture('stats.temp')
  let config = {
    checks: [
      {
        path: [fixture('small.js')],
        // @NOTE the extender registers a plugin thats
        // saves Webpack stats to fixtures/stats.temp after bundling
        configExtender: fixture('webpack.config.extender.js')
      }
    ]
  }
  expect(existsSync(generatedTempFile)).toBe(false)
  await run(config)
  expect(existsSync(generatedTempFile)).toBe(true)
})

it('throws if non existing configExtender is provided', async () => {
  let generatedTempFile = fixture('stats.temp')
  let config = {
    checks: [
      {
        path: [fixture('small.js')],
        configExtender: './i-dont-exist.js'
      }
    ]
  }

  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }
  expect(err).toEqual(new SizeLimitError('noConfigExtender'))
  expect(existsSync(generatedTempFile)).toBe(false)
})
