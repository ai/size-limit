let chalk = require('chalk')

module.exports = {
  log (msg) {
    process.stdout.write(`\n${ msg }\n`)
  },

  warn (msg) {
    this.log(`${ chalk.bgYellow(' WARNING ') } ${ chalk.yellow(msg) }`)
  },

  error (msg) {
    process.stderr.write(`${ chalk.bgRed(' ERROR ') } ${ chalk.red(msg) }\n`)
  },

  logResults (results, hint = '') {
    let output = results.map(i => i.output).join('\n')
    if (hint) {
      output += '\n  ' + hint
    }
    this.log(output)
  }
}
