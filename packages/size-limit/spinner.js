const process = require('process')

const std = process.stderr

const FgRed = '\x1b[31m'
const FgYellow = '\x1b[33m'
const FgGreen = '\x1b[32m'
const Reset = '\x1b[0m'
const HideCursor = '\x1B[?25l'
const ShowCursor = '\x1B[?25h'

class Spinner {
  constructor() {
    this.text = ''
    this.timer = null
  }

  fail() {
    return this.stopAndPrint({ color: FgRed, symbol: '✖' })
  }

  succeed() {
    return this.stopAndPrint({ color: FgGreen, symbol: '✔' })
  }

  stopAndPrint({ color, symbol }) {
    clearInterval(this.timer)

    std.clearLine()
    std.write(`${color}${symbol}${Reset} ${this.text}\n`)

    process.stdout.write(ShowCursor)
    return this
  }

  spin(text) {
    this.text = text || ''
    process.stdout.write(HideCursor)

    let spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

    let index = 0

    this.timer = setInterval(() => {
      let line = spinners[index]

      if (line === undefined) {
        index = 0
        line = spinners[index]
      }
      std.clearLine()
      std.write(`${FgYellow}${line} ${Reset}${this.text}`)

      std.cursorTo(0)

      index = index >= spinners.length ? 0 : index + 1
    }, 100)

    return this
  }
}
const spinnerFactory = function (options) {
  return new Spinner(options)
}
module.exports = spinnerFactory
