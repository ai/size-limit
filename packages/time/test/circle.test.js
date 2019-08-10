let getRunningTime = require('../get-running-time')

jest.mock('estimo', () => () => {
  throw new Error('EstimoTestError')
})

jest.mock('../cache', () => ({
  getCache () {
    return false
  },
  saveCache () { }
}))

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => true)
  delete process.env.CIRCLECI
})

afterEach(() => {
  jest.clearAllMocks()
})

const EXAMPLE = require.resolve('react/umd/react.production.min.js')

async function runWithError () {
  let err
  try {
    await getRunningTime(EXAMPLE)
  } catch (e) {
    err = e
  }
  return err.message
}

it('prints warning on Circle CI during the error', async () => {
  process.env.CIRCLECI = '1'
  expect(await runWithError()).toEqual('EstimoTestError')
  expect(console.warn).toHaveBeenCalled()
})

it('does not prints warning on other CI', async () => {
  expect(await runWithError()).toEqual('EstimoTestError')
  expect(console.warn).not.toHaveBeenCalled()
})
