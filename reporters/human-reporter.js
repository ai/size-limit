let chalk = require('chalk')

function print (msg) {
  process.stdout.write(`\n${ msg }\n`)
}

module.exports = {
  warn (msg) {
    print(`${ chalk.bgYellow.black(' WARNING ') } ${ chalk.yellow(msg) }`)
  },

  error (msg) {
    print(`${ chalk.bgRed.black(' ERROR ') } ${ chalk.red(msg) }\n`)
  },

  results (results, hint = '') {
    let output = results.map(i => i.output).join('\n')
    if (hint) {
      output += '\n  ' + hint
    }
    print(output)
  }
}
