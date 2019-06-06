import { ReporterResult } from './../interfaces'
let chalk = require('chalk')

function print (msg: string) {
  process.stdout.write(`\n${ msg }\n`)
}

export default {
  warn (msg: string) {
    print(`${ chalk.bgYellow.black(' WARNING ') } ${ chalk.yellow(msg) }`)
  },

  error (msg: string) {
    print(`${ chalk.bgRed.black(' ERROR ') } ${ chalk.red(msg) }\n`)
  },

  results (results: ReporterResult[], hint = '') {
    let output = results.map(i => i.output).join('\n')
    if (hint) {
      output += '\n  ' + hint
    }
    print(output)
  }
}
