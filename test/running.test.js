let { join } = require('path')

let getSize = require('../')

function fixture (name) {
  return join(__dirname, 'fixtures', `${ name }.js`)
}

it('calculates running time', async () => {
  let size = await getSize(fixture('bad/index'))
  expect(size.running > 0.15).toBeTruthy()
  expect(size.running < 0.3).toBeTruthy()
})
