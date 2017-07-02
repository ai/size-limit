#!/usr/bin/env node
'use strict'

const yargs = require('yargs')
const chalk = require('chalk')
const bytes = require('bytes')
const path = require('path')
const fs = require('fs')

const getSize = require('.')

const argv = yargs
  .usage('$0 [LIMIT] [FILES]')
  .boolean('why')
  .describe('why', 'Show package content')
  .version()
  .help()
  .alias('why', 'w')
  .alias('help', 'h')
  .alias('version', 'v')
  .epilog('Examples:\n' +
          '  See current project size:\n' +
          '    $0\n' +
          '  See specific files size:\n' +
          '    $0 ./index.js ./extra.js\n' +
          '  Show error if project become bigger:\n' +
          '    $0 10KB\n' +
          '    $0 10KB ./index.js ./extra.js\n' +
          '  Show package content in browser:\n' +
          '    $0 --why\n' +
          '    $0 --why ./index.js ./extra.js\n' +
          '\n' +
          'If you miss files, size-limit will take main file ' +
          'from package.json')
  .locale('en')
  .argv

function isRoot (dir) {
  if (process.platform === 'win32') {
    return /^\w:[\\/]*$/.test(dir)
  } else {
    return dir === '/'
  }
}

function showError (msg) {
  process.stderr.write(chalk.red(`${ msg }\n`))
}

function formatBytes (size) {
  const format = bytes
    .format(size, { unitSeparator: ' ' })
    .replace('k', 'K')
  return chalk.bold(format)
}

function findPackage (dir) {
  if (isRoot(dir)) return Promise.resolve(false)
  const file = path.join(dir, 'package.json')

  return new Promise(resolve => {
    fs.readFile(file, (err, data) => {
      if (err) {
        resolve(findPackage(path.dirname(dir)))
      } else {
        resolve({ package: JSON.parse(data), dir })
      }
    })
  })
}

const args = argv['_'].slice(0)
let getFiles
let limit = false

if (/^\d+(\.\d+|)$/.test(args[0]) && /^[kKMGT]?B$/.test(args[1])) {
  limit = bytes.parse(`${ args.shift() } ${ args.shift() }`)
} else if (/^\d+(\.\d+|)?([kKMGT]B|B)?$/.test(args[0])) {
  limit = bytes.parse(args.shift())
}

if (args.length > 0) {
  getFiles = Promise.resolve(args.map(i => {
    if (path.isAbsolute(i)) {
      return i
    } else {
      return path.join(process.cwd(), i)
    }
  }))
} else {
  getFiles = findPackage(process.cwd()).then(result => {
    if (result) {
      return [path.join(result.dir, result.package.main || 'index.js')]
    } else {
      return []
    }
  })
}

getFiles.then(files => {
  if (files.length === 0) {
    const error = new Error(
      'Specify project files or run in project dir with package.json')
    error.sizeLimit = true
    throw error
  }
  if (argv.why) {
    return getSize(files, {
      analyzer: process.env['NODE_ENV'] === 'test' ? 'static' : 'server'
    })
  } else {
    return getSize(files)
  }
}).then(size => {
  const note = chalk.gray('  With all dependencies, minified and gzipped\n')

  process.stdout.write(`\n`)
  if (limit && size <= limit) {
    process.stdout.write(
      `  Package size: ${ chalk.green(formatBytes(size)) }\n` +
      `  Size limit:   ${ formatBytes(limit) }\n` +
      `${ note }\n`)
  } else if (limit) {
    process.stdout.write(
      `  ${ chalk.red('Package has exceeded the size limit') }\n` +
      `  Package size: ${ chalk.red(formatBytes(size)) }\n` +
      `  Size limit:   ${ formatBytes(limit) }\n` +
      `${ note }\n`)
    process.exit(3)
  } else {
    process.stdout.write(
      `  Package size: ${ formatBytes(size) }\n` +
      `${ note }\n`)
  }
}).catch(e => {
  if (e.sizeLimit) {
    showError(e.message)
  } else if (e.message.indexOf('Module not found:') !== -1) {
    const first = e.message.match(/Module not found:[^\n]*/)[0]
    const filtered = first.replace('Module not found: Error: ', '')
    showError(filtered)
  } else {
    showError(e.stack)
  }
  process.exit(1)
})
