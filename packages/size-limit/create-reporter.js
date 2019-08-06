let chalk = require('chalk')

function createJsonReporter (process) {
  function print (data) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n')
  }

  return {
    error (err) {
      print({ error: err.stack })
    },

    results () {
      // TODO
    }
  }
}

function createHumanReporter (process) {
  return {
    error (err) {
      let msg
      if (err.name === 'SizeLimitError') {
        msg = err.message
          .split('. ')
          .map(i => i.replace(/`([^`]*)`/g, chalk.yellow('$1')))
          .join('.\n        ')
      } else {
        msg = err.stack
      }
      process.stderr.write(
        `${ chalk.bgRed.black(' ERROR ') } ${ chalk.red(msg) }\n`
      )
    },

    results () {
      // TODO
    }
  }
}

module.exports = (process, isJSON) => {
  return isJSON ? createJsonReporter(process) : createHumanReporter(process)
}
