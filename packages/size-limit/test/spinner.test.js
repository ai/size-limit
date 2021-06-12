const Spinner = require('../spinner')

jest.useFakeTimers()
const testString = 'LoL!'

jest.mock('process', () => ({
  stderr: {
    clearLine: jest.fn(),
    write: jest.fn(),
    cursorTo: jest.fn()
  }
}))

describe('spinner', () => {
  afterEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  it('creates an empty spinner', () => {
    let spinner = Spinner().start()
    expect(spinner._text).toEqual('')
    expect(setInterval).toHaveBeenCalledTimes(1)
  })

  it('creates a spinner', () => {
    let spinner = Spinner(testString).start()
    expect(spinner._text).toEqual(testString)
    expect(setInterval).toHaveBeenCalledTimes(1)
  })

  it('_intervalCallback', () => {
    let _Spinner = require('../spinner')

    let spinner = _Spinner(testString)
    let spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

    expect(spinner._intervalCallback(10, spinners)).toEqual(1)
  })

  it('scroll to first symbol after the loop', () => {
    let process = require('process')
    let _Spinner = require('../spinner')
    let spinner = _Spinner(testString)
    spinner.start()
    jest.advanceTimersByTime(1100)
    expect(process.stderr.write).toHaveBeenLastCalledWith(
      '\x1b[33m⠋ \x1b[0mLoL!'
    )
    spinner.stop()
  })

  it('scroll to last animation', () => {
    let process = require('process')
    let _Spinner = require('../spinner')

    let spinner = _Spinner(testString)
    spinner.start()
    jest.advanceTimersByTime(1000)

    expect(process.stderr.clearLine).toHaveBeenCalledTimes(10)
    expect(process.stderr.cursorTo).toHaveBeenCalledWith(0)
    spinner.stop()
  })

  it('stop and print something generic', () => {
    let process = require('process')
    let _Spinner = require('../spinner')

    let spinner = _Spinner(testString)
    spinner._stopAndPrint({ color: '\x1b[31m', symbol: 'X' })
    expect(process.stderr.clearLine).toHaveBeenCalledWith()
    expect(process.stderr.write).toHaveBeenCalledWith('\x1b[31mX\x1b[0m LoL!\n')
    expect(process.stderr.write).toHaveBeenCalledWith('\x1B[?25h')
  })

  it('#fail', () => {
    let spinner = Spinner(testString)
    let spy = jest.spyOn(spinner, '_stopAndPrint')
    spinner.fail()
    expect(spy).toHaveBeenCalledWith({ color: '\x1B[31m', symbol: '✖' })
  })

  it('#succeed', () => {
    let spinner = Spinner(testString)
    let spy = jest.spyOn(spinner, '_stopAndPrint')
    spinner.succeed()
    expect(spy).toHaveBeenCalledWith({ color: '\x1b[32m', symbol: '✔' })
  })
})
