#!/usr/bin/env node

let ciJobNumber = require('ci-job-number')

let getReporter = require('./reporters')

if (ciJobNumber() !== 1) {
  getReporter().warn(
    'Size Limits run only on first CI job, to save CI resources'
  )
  process.exit(0)
}

require('./cli-body.js')
