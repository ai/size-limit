let webpackPlugin = require('@size-limit/webpack')
let esbuildPlugin = require('@size-limit/esbuild')
let filePlugin = require('@size-limit/file')
let { join } = require('path')

let sizeLimit = require('../')

const ROOT = join(__dirname, '..', '..', '..')
const INTEGRATION = join(ROOT, 'fixtures', 'integration', 'index.js')

it('has JS API', async () => {
  let result = await sizeLimit([webpackPlugin, filePlugin], [INTEGRATION])
  expect(result).toEqual([{ size: 141 }])
})

it('works with file module only', async () => {
  let result = await sizeLimit([filePlugin], [INTEGRATION])
  expect(result).toEqual([{ size: 37 }])
})

it('works with esbuild module', async () => {
  let result = await sizeLimit([esbuildPlugin, filePlugin], [INTEGRATION])

  expect(result).toEqual([{ size: 87 }])
})
