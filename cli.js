#!/usr/bin/env node
'use strict'

const yargs = require('yargs')
const path = require('path')

const getSize = require('.')

const argv = yargs
  .example('$0 ./index.js ./extra.js')
  .locale('en')
  .version()
  .help()
  .argv

const files = argv['_'].map(i => path.join(process.cwd(), i))

getSize.apply({ }, files).then(size => {
  process.stdout.write(`${ size }\n`)
})
