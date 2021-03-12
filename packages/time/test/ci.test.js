let getRunningTime = require('../get-running-time')

jest.mock('estimo', () => () => {
  throw new Error('libX11-xcb.so.1')
})

jest.mock('../cache', () => ({
  getCache() {
    return false
  },
  saveCache() {}
}))

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => true)
  delete process.env.CI
})

afterEach(() => {
  jest.clearAllMocks()
})

const EXAMPLE = require.resolve('nanoid/index.browser.js')

async function runWithError() {
  let err
  try {
    await getRunningTime(EXAMPLE)
  } catch (e) {
    err = e
  }
  return err.message
}

it('prints warning on Circle CI during the error', async () => {
  process.env.CI = '1'
  expect(await runWithError()).toEqual('libX11-xcb.so.1')
  expect(console.warn).toHaveBeenCalledTimes(1)
})

it('does not prints warning on non-CI', async () => {
  expect(await runWithError()).toEqual('libX11-xcb.so.1')
  expect(console.warn).not.toHaveBeenCalled()
})
