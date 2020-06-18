#!/usr/bin/env node

let ciJobNumber = require('ci-job-number')
let kleur = require('kleur')

if (ciJobNumber() !== 1) {
  process.stderr.write(
    kleur.yellow('Size Limit runs only on first CI job, to save CI resources\n')
  )
  process.exit(0)
}

require('./run.js')(process)
