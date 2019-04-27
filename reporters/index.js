const HumanReporter = require('./human-reporter')
const JsonReporter = require('./json-reporter')

function getReporter ({ argv = {} } = {}) {
  let Reporter = argv.json ? JsonReporter : HumanReporter
  return new Reporter()
}

module.exports = getReporter
