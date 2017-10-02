#!/usr/bin/env node
'use strict'

const ciJobNumber = require('ci-job-number')
const readPkg = require('read-pkg-up')
const globby = require('globby')
const yargs = require('yargs')
const chalk = require('chalk')
const bytes = require('bytes')
const path = require('path')

const getSize = require('.')

const EXAMPLE = '\n' +
                '  "size-limit": [\n' +
                '    {\n' +
                '      "path": "index.js",\n' +
                '      "limit": "9 KB"\n' +
                '    }\n' +
                '  ]'

const argv = yargs
  .usage('$0')
  .option('why', {
    alias: 'w',
    describe: 'Show package content',
    type: 'boolean'
  })
  .option('no-webpack', {
    describe: 'Disable webpack',
    type: 'boolean'
  })
  .alias('help', 'h')
  .alias('version', 'v')
  .epilog('Usage:\n' +
          '  $0\n' +
          '    Read configuration from package.json and check limit.\n' +
          '  $0 --why\n' +
          '    Show reasons why project have this size.\n' +
          '  $0 index.js\n' +
          '    Check specific file size with all file dependencies.\n' +
          '\n' +
          'Size Limit will read size-limit section from package.json.\n' +
          'Configuration example:\n' +
          EXAMPLE)
  .locale('en')
  .argv

function ownError (msg) {
  const error = new Error(msg)
  error.sizeLimit = true
  return error
}

function isStrings (value) {
  if (!Array.isArray(value)) return false
  return value.every(i => typeof i === 'string')
}

function configError (limits) {
  if (!Array.isArray(limits)) {
    return 'The `"size-limit"` section of package.json must be `an array`'
  }
  if (limits.length === 0) {
    return 'The `"size-limit"` section of package.json must `not be empty`'
  }
  for (const limit of limits) {
    if (typeof limit !== 'object') {
      return 'The `"size-limit"` array in package.json ' +
             'should contain only objects'
    }
    if (typeof limit.path !== 'string' && !isStrings(limit.path)) {
      return 'The `path` in Size Limit config must be `a string` ' +
             'or `an array of strings`'
    }
  }
  return false
}

function formatBytes (size) {
  return bytes.format(size, { unitSeparator: ' ' })
}

function warn (messages) {
  const prefix = `${ chalk.bgYellow.black(' WARN ') } `
  process.stderr.write(prefix + messages.map((message, index) => {
    const highlighted = message.replace(/`([^`]*)`/g, chalk.bold('$1'))
    const str = `${ chalk.yellow(highlighted) }\n`
    return index === 0 ? str : `       ${ str }`
  }).join(''))
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
        'Can not find `package.json`. ' +
        'Be sure that you run Size Limit inside project dir.'
      )
    } else if (!result.pkg['size-limit'] && !result.pkg['sizeLimit']) {
      throw ownError(
        'Can not find `"size-limit"` section in `package.json`. ' +
        'Add it according to Size Limit docs.' +
        `\n${ EXAMPLE }\n`
      )
    }

    if (result.pkg.sizeLimit) {
      warn([
        'Section name `"sizeLimit"` in package.json was deprecated.',
        'Use `"size-limit"` for section name.'
      ])
    }

    const limits = result.pkg['size-limit'] || result.pkg['sizeLimit']

    if (configError(limits)) {
      throw ownError(
        configError(limits) + '. ' +
        'Fix it according to Size Limit docs.' +
        `\n${ EXAMPLE }\n`
      )
    }

    return Promise.all(limits.map(limit => {
      const cwd = path.dirname(result.path)
      return globby(limit.path, { cwd }).then(files => {
        if (files.length === 0) {
          files = limit.path
          if (typeof files === 'string') files = [files]
        }
        if (limit.babili) {
          warn([
            'Option `"babili": true` was deprecated.',
            'Size Limit now supports ES2016 out of box.',
            'You can remove this option.'
          ])
        }
        return {
          webpack: limit.webpack !== false,
          bundle: result.pkg.name,
          ignore: result.pkg.peerDependencies,
          limit: limit.limit,
          full: files.map(i => path.join(cwd, i)),
          files
        }
      })
    }))
  })
} else {
  const files = argv['_'].slice(0)

  let limit
  if (/^\d+(\.\d+|)$/.test(files[0]) && /^[kKMGT]?B$/.test(files[1])) {
    limit = bytes.parse(`${ files.shift() } ${ files.shift() }`)
  } else if (/^\d+(\.\d+|)?([kKMGT]B|B)?$/.test(files[0])) {
    limit = bytes.parse(files.shift())
  }

  if (limit) {
    warn([
      'Limit argument in Size Limit CLi was deprecated.',
      'Use `size-limit` section in `package.json` to specify limit.'
    ])
  }
  if (argv.babili) {
    warn([
      'Argument `--babili` was deprecated.',
      'Size Limit now supports ES2016 out of box.',
      'You can remove this argument.'
    ])
  }

  if (files.length === 0) {
    getOptions = Promise.reject(
      ownError(
        'Specify file for Size Limit. ' +
        `For example, \`size-limit ${ argv['_'] } index.js\`.`
      )
    )
  } else {
    const full = files.map(i => {
      if (path.isAbsolute(i)) {
        return i
      } else {
        return path.join(process.cwd(), i)
      }
    })

    getOptions = Promise.resolve([
      {
        webpack: argv.webpack !== false,
        path: files,
        limit,
        full
      }
    ])
  }
}

getOptions.then(files => {
  return Promise.all(files.map(file => {
    if (file.webpack === false && argv.why) {
      throw ownError(
        '`--why` does not work with `"webpack": false`. ' +
        'Add Webpack Bundle Analyzer to your Webpack config.'
      )
    }
    const opts = { bundle: file.bundle, webpack: file.webpack }
    if (file.ignore) {
      opts.ignore = Object.keys(file.ignore)
    }
    if (argv.why && files.length === 1) {
      opts.analyzer = process.env['NODE_ENV'] === 'test' ? 'static' : 'server'
    }
    return getSize(file.full, opts).then(size => {
      file.size = size
      return file
    })
  }))
}).then(files => {
  process.stdout.write('\n')

  const checks = files.map(file => {
    const limit = bytes.parse(file.limit)
    file.passed = true

    if (files.length > 1) {
      process.stdout.write(chalk.gray(`  ${ file.files }\n`))
    }

    let limitString = formatBytes(limit)
    let sizeString = formatBytes(file.size)

    if (limit && file.size <= limit) {
      process.stdout.write(
        `  Package size: ${ chalk.bold(chalk.green(sizeString)) }\n` +
        `  Size limit:   ${ chalk.bold(limitString) }\n`)
    } else if (limit) {
      if (limitString === sizeString) {
        limitString = limit + ' B'
        sizeString = file.size + ' B'
      }
      const diff = formatBytes(file.size - limit)
      process.stdout.write(
        `  ${ chalk.red('Package size limit has exceeded by ' + diff) }\n` +
        `  Package size: ${ chalk.bold(chalk.red(sizeString)) }\n` +
        `  Size limit:   ${ chalk.bold(limitString) }\n`)
      file.passed = false
    } else {
      process.stdout.write(
        `  Package size: ${ chalk.bold(sizeString) }\n`)
    }

    if (files.length > 1) process.stdout.write('\n')
    return file
  })

  process.stdout.write(
    chalk.gray('  With all dependencies, minified and gzipped\n\n'))

  return checks
}).then(files => {
  if (argv.why && files.length > 1) {
    const opts = {
      analyzer: process.env['NODE_ENV'] === 'test' ? 'static' : 'server',
      bundle: files[0].bundle
    }
    const full = files.reduce((all, i) => all.concat(i.full), [])
    return getSize(full, opts).then(() => files)
  } else {
    return files
  }
}).then(files => {
  if (!argv.why) {
    if (files.some(i => !i.passed)) {
      process.exit(3)
    } else {
      process.exit(0)
    }
  }
}).catch(e => {
  let msg
  if (e.sizeLimit) {
    msg = e.message
      .split('. ')
      .map(i => i.replace(/`([^`]*)`/g, chalk.bold('$1')))
      .join('.\n        ')
  } else if (e.message.indexOf('Module not found:') !== -1) {
    const first = e.message.match(/Module not found:[^\n]*/)[0]
    msg = `Size Limit c${ first.replace('Module not found: Error: C', '') }`
      .replace(/resolve '(.*)' in '(.*)'/,
        `resolve\n        ${ chalk.bold('$1') }` +
        `\n        in ${ chalk.bold('$2') }`
      )
  } else {
    msg = e.stack
  }

  process.stderr.write(`${ chalk.bgRed(' ERROR ') } ${ chalk.red(msg) }\n`)
  process.exit(1)
})
