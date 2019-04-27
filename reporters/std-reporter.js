const { BaseReporter } = require('./base-reporter')

class StdReporter extends BaseReporter {
  log ({ message }) {
    process.stdout.write(`\n${ message }\n`)
  }

  warn ({ message }) {
    this.log({ message })
  }

  error ({ message }) {
    process.stderr.write(`${ message }\n`)
  }
}

module.exports = {
  StdReporter
}
