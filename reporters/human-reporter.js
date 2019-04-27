let chalk = require('chalk')

function print (msg) {
  process.stdout.write(`\n${ msg }\n`)
}

module.exports = {
  warn (msg) {
    print(`${ chalk.bgYellow(' WARNING ') } ${ chalk.yellow(msg) }`)
  },

  error (msg) {
    print(`${ chalk.bgRed(' ERROR ') } ${ chalk.red(msg) }\n`)
  },

  results (results, hint = '') {
    let output = results.map(i => i.output).join('\n')
    if (hint) {
      output += '\n  ' + hint
    }
    print(output)
  }
}
