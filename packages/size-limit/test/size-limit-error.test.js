let SizeLimitError = require('../size-limit-error')
let createReporter = require('../create-reporter')

function print (err) {
  let stderr = ''
  let process = {
    stderr: {
      write  (str) {
        stderr += str
      }
    }
  }
  let processor = createReporter(process, false)
  processor.error(err)
  return stderr
}

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

it('has error for unknown option', () => {
  let err = new SizeLimitError('missedPlugin', 'webpack', 'file')
  expect(print(err)).toMatchSnapshot()
})

it('has error for unknown entry', () => {
  let err = new SizeLimitError('unknownEntry', 'admin')
  expect(print(err)).toMatchSnapshot()
})
