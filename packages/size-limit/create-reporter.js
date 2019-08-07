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
      if (err.name === 'SizeLimitError') {
        let msg = err.message
          .split('. ')
          .map(i => i.replace(/\*([^*]+)\*/g, chalk.yellow('$1')))
          .join('.\n        ')
        process.stderr.write(
          `${ chalk.bgRed.black(' ERROR ') } ${ chalk.red(msg) }\n`
        )
        if (err.example) {
          process.stderr.write(
            '\n' + err.example
              .replace(/("[^"]+"):/g, chalk.green('$1') + ':')
              .replace(/: ("[^"]+")/g, ': ' + chalk.yellow('$1'))
          )
        }
      } else {
        process.stderr.write(
          `${ chalk.bgRed.black(' ERROR ') } ${ chalk.red(err.stack) }\n`
        )
      }
    },

    results () {
      // TODO
    }
  }
}

module.exports = (process, isJSON) => {
  return isJSON ? createJsonReporter(process) : createHumanReporter(process)
}
