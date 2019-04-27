const { StdReporter } = require('./std-reporter')

class StdMultilineReporter extends StdReporter {
  logResults ({ results, hint = '' }) {
    let output = results.map(i => i.output).join('\n')
    if (hint) {
      output += '\n  ' + hint
    }
    super.log({ message: output })
  }
}

module.exports = {
  StdMultilineReporter
}
