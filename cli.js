#!/usr/bin/env node

let ciJobNumber = require('ci-job-number')
let chalk = require('chalk')

if (ciJobNumber() !== 1) {
  process.stdout.write(
    chalk.yellow('Size Limit runs only on first CI job, to save CI resources\n')
  )
  process.exit(0)
}

require('./cli-body.js')
