let SizeLimitError = require('../size-limit-error')

it('has mark', () => {
  let err = new SizeLimitError('noPackage')
  expect(err.name).toEqual('SizeLimitError')
})

it('has start', () => {
  let err = new SizeLimitError('noPackage')
  expect(err.stack).toContain('size-limit-error.test.js')
})

it('has message', () => {
  let err = new SizeLimitError('noPackage')
  expect(err.message).toContain('Create npm package')
})
