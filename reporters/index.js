const { StdMultilineReporter } = require('./std-multiline-reporter')
const { StdJsonReporter } = require('./std-json-reporter')

function getReporter ({ argv = {} } = {}) {
  let Reporter = argv.json ? StdJsonReporter : StdMultilineReporter
  return new Reporter()
}

module.exports = {
  getReporter
}
