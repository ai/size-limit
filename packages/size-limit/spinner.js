let process = require('process')

let stdout = process.stdout

const SYMBOLS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

const START_COLORING = {
  green: '\x1b[32m',
  red: '\x1b[91m'
}

const END_COLORING = '\x1b[0m'

class Spinner {
  constructor(currentText = '') {
    this.currentText = currentText
    this.intevalId = null
    this.intervalMs = 80
  }

  hideCursor() {
    stdout.write('\x1b[?25l')
  }

  showCursor() {
    stdout.write('\x1b[?25h')
  }

  updateText(text) {
    if (text !== undefined) this.currentText = text
  }

  printSymbolWithText(sign, signColor, text) {
    stdout.write(`${START_COLORING[signColor]}${sign}${END_COLORING} ${text}\n`)
  }

  start(text) {
    this.updateText(text)
    this.hideCursor()

    let index = 0

    this.intevalId = setInterval(() => {
      let line = `${SYMBOLS[index]} ${this.currentText}`
      stdout.write(line)
      stdout.cursorTo(0)
      index = index >= SYMBOLS.length - 1 ? 0 : index + 1
    }, this.intervalMs)
  }

  stopSpinning() {
    clearInterval(this.intevalId)
    this.intevalId = null
    stdout.clearLine()
  }

  succeed(text) {
    this.updateText(text)
    this.stopSpinning()
    this.printSymbolWithText('✔', 'green', this.currentText)
    this.showCursor()

    return this
  }

  fail(text) {
    this.updateText(text)
    this.stopSpinning()
    this.printSymbolWithText('✖', 'red', this.currentText)
    this.showCursor()

    return this
  }
}

const spinnerFactory = function (text) {
  return new Spinner(text)
}

module.exports = spinnerFactory
