#!/usr/bin/env node

let ciJobNumber = require('ci-job-number')

let getReporter = require('./reporters')

let reporter = getReporter()

if (ciJobNumber() !== 1) {
  reporter.warn('Size Limits run only on first CI job, to save CI resources')
  process.exit(0)
}

require('./runner.js')
