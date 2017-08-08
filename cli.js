#!/usr/bin/env node
'use strict'

const ciJobNumber = require('ci-job-number')
const readPkg = require('read-pkg-up')
const globby = require('globby')
const yargs = require('yargs')
const chalk = require('chalk')
const bytes = require('bytes')
const path = require('path')

const legacyApi = require('./legacy-api')
const getSize = require('.')

const argv = yargs
  .usage('$0')
  .option('why', {
    alias: 'w',
    describe: 'Show package content',
    type: 'boolean'
  })
  .option('babili', {
    describe: 'Use Babili minifier to support ES2016+ projects',
    type: 'boolean'
  })
  .version()
  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .epilog('Size Limit will read size-limit section from package.json.\n' +
          'Configuration example:\n' +
          '\n' +
          '  "size-limit": [\n' +
          '    {\n' +
          '      "path": "index.js",\n' +
          '      "limit": "9 KB",\n' +
          '      "babili": true\n' +
          '    }\n' +
          '  ]')
  .locale('en')
  .argv

function ownError (msg) {
  const error = new Error(msg)
  error.sizeLimit = true
  return error
}

function formatBytes (size) {
  const format = bytes
    .format(size, { unitSeparator: ' ' })
    .replace('k', 'K')
  return chalk.bold(format)
}

if (ciJobNumber() !== 1) {
  process.stdout.write(
    chalk.yellow('Size Limits run only on first CI job, to save CI resources'))
  process.stdout.write('\n')
  process.exit(0)
}

let getOptions
if (argv['_'].length === 0) {
  getOptions = readPkg().then(result => {
    if (!result.pkg) {
      throw ownError(
        'Can not find package.json. ' +
        'Be sure that your run Size Limit inside project dir.'
      )
    } else if (!result.pkg['size-limit'] && !result.pkg['sizeLimit']) {
      throw ownError(
        'Can not find size-limit section in package.json. ' +
        'Add it according Size Limit docs.'
      )
    }

    const limits = result.pkg['size-limit'] || result.pkg['sizeLimit']
    return Promise.all(limits.map(limit => {
      const cwd = path.dirname(result.path)
      return globby(limit.path, { cwd }).then(files => {
        if (files.length === 0) {
          files = limit.path
          if (typeof files === 'string') files = [files]
        }
        return {
          bundle: result.pkg.name,
          babili: limit.babili,
          limit: limit.limit,
          full: files.map(i => path.join(cwd, i)),
          files
        }
      })
    }))
  })
} else {
  getOptions = legacyApi(argv)
}

getOptions.then(files => {
  return Promise.all(files.map(file => {
    const opts = {
      minifier: file.babili ? 'babili' : 'uglifyjs',
      bundle: file.bundle
    }
    if (argv.why) {
      opts.analyzer = process.env['NODE_ENV'] === 'test' ? 'static' : 'server'
    }
    return getSize(file.full, opts).then(size => ({
      limit: bytes.parse(file.limit),
      files: file.files,
      size
    }))
  }))
}).then(files => {
  process.stdout.write('\n')

  let bad = false
  for (const file of files) {
    if (files.length > 1) {
      process.stdout.write(chalk.gray(`  ${ file.files }\n`))
    }
    if (file.limit && file.size <= file.limit) {
      process.stdout.write(
        `  Package size: ${ chalk.green(formatBytes(file.size)) }\n` +
        `  Size limit:   ${ formatBytes(file.limit) }\n`)
    } else if (file.limit) {
      process.stdout.write(
        `  ${ chalk.red('Package has exceeded the size limit') }\n` +
        `  Package size: ${ chalk.red(formatBytes(file.size)) }\n` +
        `  Size limit:   ${ formatBytes(file.limit) }\n`)
      bad = true
    } else {
      process.stdout.write(
        `  Package size: ${ formatBytes(file.size) }\n`)
    }
  }

  process.stdout.write(
    chalk.gray('  With all dependencies, minified and gzipped\n\n'))
  if (bad) process.exit(3)
}).catch(e => {
  let msg
  if (e.sizeLimit) {
    msg = e.message.split('. ').join('.\n')
  } else if (e.message.indexOf('Module not found:') !== -1) {
    const first = e.message.match(/Module not found:[^\n]*/)[0]
    const filtered = first.replace('Module not found: Error: ', '')
    msg = filtered
  } else {
    msg = e.stack
  }

  process.stderr.write(chalk.red(`${ msg }\n`))
  process.exit(1)
})
