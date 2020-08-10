let { join } = require('path')

process.args = ['node', 'size-limit']
process.cwd = function () {
  return join(__dirname, 'fixtures', 'max-listeners')
}

require('../run.js')(process)
