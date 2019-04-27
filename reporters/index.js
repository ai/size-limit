let humanReporter = require('./human-reporter')
let jsonReporter = require('./json-reporter')

module.exports = function getReporter (argv = { }) {
  return argv.json ? jsonReporter : humanReporter
}
