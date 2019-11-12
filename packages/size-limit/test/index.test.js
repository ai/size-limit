const filePlugin = require('@size-limit/file')
const webpackPlugin = require('@size-limit/webpack')
let { join } = require('path')

const sizeLimit = require('../')

it('has JS API', async () => {
  let result = await sizeLimit(
    [webpackPlugin, filePlugin],
    [join(__dirname, 'fixtures', 'integration', 'index.js')]
  )
  expect(result).toEqual([{ size: 23 }])
})
