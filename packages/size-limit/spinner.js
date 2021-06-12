const process = require('process')

const std = process.stderr

const FgRed = '\x1b[31m'
const FgYellow = '\x1b[33m'
const FgGreen = '\x1b[32m'
const Reset = '\x1b[0m'
const HideCursor = '\x1B[?25l'
const ShowCursor = '\x1B[?25h'

function Spinner(text = '') {
  let _text = text
  let _timer = null

  return {
    _text,
    _timer,
    _stopAndPrint({ color, symbol }) {
      clearInterval(this._timer)

      std.clearLine()
      std.write(`${color}${symbol}${Reset} ${this._text}\n`)

      std.write(ShowCursor)
      return this
    },
    fail() {
      return this._stopAndPrint({ color: FgRed, symbol: '✖' })
    },
    succeed() {
      return this._stopAndPrint({ color: FgGreen, symbol: '✔' })
    },
    start() {
      std.write(HideCursor)

      let spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      let index = 0

      this._timer = setInterval(() => {
        index = this._intervalCallback(index, spinners)
      }, 100)
      return this
    },
    _intervalCallback(index, spinners) {
      let line = spinners[index]

      if (line === undefined) {
        index = 0
        line = spinners[index]
      }
      std.clearLine()
      std.write(`${FgYellow}${line} ${Reset}${this._text}`)

      std.cursorTo(0)

      return index + 1
    },
    stop() {
      clearInterval(this._timer)

      std.clearLine()

      std.write(ShowCursor)
      return this
    }
  }
}

module.exports = Spinner
