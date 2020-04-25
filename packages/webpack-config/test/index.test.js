const sizeLimit = require('size-limit')
const filePlugin = require('@size-limit/file')
const webpackPlugin = require('@size-limit/webpack')
const webpackConfigPlugin = require('@size-limit/webpack-config')
const { join } = require('path')
const { existsSync } = require('fs')
const rimraf = require('rimraf')

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
  let filePath = fixture('small.js')
  // @NOTE the extender registers a plugin thats
  // saves Webpack stats to fixtures/stats.temp after bundling
  let extenderPath = fixture('webpack.config.extender.js')
  let generatedTempFile = fixture('stats.temp')
  expect(existsSync(generatedTempFile)).toBe(false)

  await sizeLimit([
    filePlugin,
    webpackConfigPlugin({
      extenderPath
    }),
    webpackPlugin
  ], [filePath])

  expect(existsSync(generatedTempFile)).toBe(true)
})
