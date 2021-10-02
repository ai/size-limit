const webpackPlugin = require('@size-limit/webpack')
const filePlugin = require('@size-limit/file')
let { join } = require('path')

const sizeLimit = require('../')

it('has JS API', async () => {
  let result = await sizeLimit(
    [webpackPlugin, filePlugin],
    [join(__dirname, 'fixtures', 'integration', 'index.js')]
  )
  expect(result).toEqual([{ size: 141 }])
})

it('works with file module only', async () => {
  let result = await sizeLimit(
    [filePlugin],
    [join(__dirname, 'fixtures', 'integration', 'index.js')]
  )
  expect(result).toEqual([{ size: 37 }])
})
