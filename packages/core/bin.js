#!/usr/bin/env node

let ciJobNumber = require('ci-job-number')
let chalk = require('chalk')

if (ciJobNumber() !== 1) {
  process.stderr.write(
    chalk.yellow('Size Limit runs only on first CI job, to save CI resources\n')
  )
  process.exit(0)
}

require('./run.js')(process)
