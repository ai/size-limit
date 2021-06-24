jest.mock('process', () => ({
  stdout: {
    clearLine: jest.fn(),
    write: jest.fn(),
    cursorTo: jest.fn()
  }
}))
let process = require('process')

let spinnerFactory = require('../spinner')

let write = process.stdout.write

const START_TEXT = 'spinner'
const SUCCESS_TEXT = 'success'
const FAILURE_TEXT = 'fail'

const SYMBOLS_LENGTH = 10

jest.useFakeTimers()

describe('spinner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a spinner and prints nothing', () => {
    expect.assertions(2)
    let spinner = spinnerFactory()
    expect(spinner).toBeDefined()
    expect(write).toHaveBeenCalledTimes(0)
  })

  it('hides cursor after starting a spinner', () => {
    expect.assertions(1)
    let spinner = spinnerFactory()
    spinner.start()
    expect(write).toHaveBeenCalledWith('\x1b[?25l')
  })

  it('shows the first frame of the a spinner with text', () => {
    expect.assertions(2)
    let spinner = spinnerFactory()
    spinner.start(START_TEXT)
    expect(write).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(spinner.intervalMs)
    expect(write).toHaveBeenCalledWith(`⠋ ${START_TEXT}`)
  })

  it('shows the last frame of the a spinner with text', () => {
    expect.assertions(1)
    let spinner = spinnerFactory()
    spinner.start(START_TEXT)
    jest.advanceTimersByTime(spinner.intervalMs * SYMBOLS_LENGTH)
    expect(write).toHaveBeenLastCalledWith(`⠏ ${START_TEXT}`)
  })

  it('shows success sign and text after succeed() call', () => {
    expect.assertions(2)
    let spinner = spinnerFactory()
    spinner.start(START_TEXT)
    jest.advanceTimersByTime(spinner.intervalMs * 2)
    expect(write).toHaveBeenCalledWith(expect.stringContaining(START_TEXT))
    spinner.succeed(SUCCESS_TEXT)
    expect(write).toHaveBeenNthCalledWith(
      write.mock.calls.length - 1,
      `\x1b[32m✔\x1b[0m ${SUCCESS_TEXT}\n`
    )
  })

  it('shows cursor after succeed() call', () => {
    expect.assertions(1)
    let spinner = spinnerFactory()
    spinner.start()
    spinner.succeed()
    expect(write).toHaveBeenLastCalledWith('\x1b[?25h')
  })

  it('shows failure sign and text after fail() call', () => {
    expect.assertions(2)
    let spinner = spinnerFactory()
    spinner.start(START_TEXT)
    jest.advanceTimersByTime(spinner.intervalMs * 2)
    expect(write).toHaveBeenCalledWith(expect.stringContaining(START_TEXT))
    spinner.fail(FAILURE_TEXT)
    expect(write).toHaveBeenNthCalledWith(
      write.mock.calls.length - 1,
      `\x1b[91m✖\x1b[0m ${FAILURE_TEXT}\n`
    )
  })

  it('shows cursor after fail() call', () => {
    expect.assertions(1)
    let spinner = spinnerFactory()
    spinner.start()
    spinner.fail()
    expect(write).toHaveBeenLastCalledWith('\x1b[?25h')
  })
})
