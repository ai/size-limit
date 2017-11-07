#!/usr/bin/env node
'use strict'

const ciJobNumber = require('ci-job-number')
const cosmiconfig = require('cosmiconfig')
const readPkg = require('read-pkg-up')
const globby = require('globby')
const yargs = require('yargs')
const chalk = require('chalk')
const bytes = require('bytes')
const path = require('path')

const getSize = require('.')

const PACKAGE_EXAMPLE = '\n' +
                        '  "size-limit": [\n' +
                        '    {\n' +
                        '      "path": "index.js",\n' +
                        '      "limit": "9 KB"\n' +
                        '    }\n' +
                        '  ]'
const FILE_EXAMPLE = '\n' +
                     '  [\n' +
                     '    {\n' +
                     '      path: "index.js",\n' +
                     '      limit: "9 KB"\n' +
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
  .option('config', {
    describe: 'Custom webpack config',
    type: 'string'
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
          'Size Limit will read size-limit section from package.json:\n' +
          PACKAGE_EXAMPLE + '\n\n' +
          'or from .size-limit config:\n' +
          FILE_EXAMPLE)
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

const PACKAGE_ERRORS = {
  notArray: 'The `"size-limit"` section of package.json must be `an array`',
  empty: 'The `"size-limit"` section of package.json must `not be empty`',
  notObject: 'The `"size-limit"` array in package.json ' +
             'should contain only objects',
  notString: 'The `path` in Size Limit config must be `a string` ' +
             'or `an array of strings`'
}

const FILE_ERRORS = {
  notArray: 'Size Limit config must contain `an array`',
  empty: 'Size Limit config must `not be empty`',
  notObject: 'Size Limit config should contain only objects',
  notString: 'The `path` in Size Limit config must be `a string` ' +
             'or `an array of strings`'
}

function configError (limits) {
  if (!Array.isArray(limits)) {
    return 'notArray'
  }
  if (limits.length === 0) {
    return 'empty'
  }
  for (const limit of limits) {
    if (typeof limit !== 'object') {
      return 'notObject'
    }
    if (typeof limit.path !== 'string' && !isStrings(limit.path)) {
      return 'notString'
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

function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1)
}

function getConfig () {
  const configExplorer = cosmiconfig('size-limit', {
    rc: '.size-limit',
    js: false
  })
  return configExplorer.load(process.cwd())
    .then(result => {
      if (result === null) {
        throw ownError(
          'Can not find settings for Size Limit. ' +
          'Add it to section `"size-limit"` in package.json ' +
          'according to Size Limit docs.' +
          `\n${ PACKAGE_EXAMPLE }\n`
        )
      }
      return result
    })
    .catch(err => {
      if (err.name === 'JSONError') {
        let message = err.message
        if (/JSON Error in [^\n]+:\n([^\n]+)\n/.test(message)) {
          message = message.match(/JSON Error in [^\n]+:\n([^\n]+)\n/)[1]
        }
        throw ownError(
          'Can not parse `package.json`. ' +
          message + '. ' +
          'Change config according to Size Limit docs.\n' +
          PACKAGE_EXAMPLE + '\n'
        )
      } else if (err.reason && err.mark && err.mark.name) {
        const file = path.relative(process.cwd(), err.mark.name)
        const position = err.mark.line + ':' + err.mark.column
        throw ownError(
          'Can not parse `' + file + '` at ' + position + '. ' +
          capitalize(err.reason) + '. ' +
          'Change config according to Size Limit docs.\n' +
          FILE_EXAMPLE + '\n'
        )
      } else {
        throw err
      }
    })
}

if (ciJobNumber() !== 1) {
  process.stdout.write(
    chalk.yellow('Size Limits run only on first CI job, to save CI resources'))
  process.stdout.write('\n')
  process.exit(0)
}

let getOptions
if (argv['_'].length === 0) {
  getOptions = Promise.all([getConfig(), readPkg()]).then(all => {
    const config = all[0]
    const packageJson = all[1] ? all[1].pkg : { }

    const error = configError(config.config)
    if (error) {
      if (/package\.json$/.test(config.filepath)) {
        throw ownError(
          PACKAGE_ERRORS[error] + '. ' +
          'Fix it according to Size Limit docs.' +
          `\n${ PACKAGE_EXAMPLE }\n`
        )
      } else {
        throw ownError(
          FILE_ERRORS[error] + '. ' +
          'Fix it according to Size Limit docs.' +
          `\n${ FILE_EXAMPLE }\n`
        )
      }
    }

    return Promise.all(config.config.map(limit => {
      const cwd = path.dirname(config.filepath)
      return globby(limit.path, { cwd }).then(files => {
        if (files.length === 0) {
          files = limit.path
          if (typeof files === 'string') files = [files]
        }
        return {
          webpack: limit.webpack !== false,
          bundle: packageJson.name,
          config: limit.config,
          ignore: packageJson.peerDependencies,
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
    const opts = {
      bundle: file.bundle,
      webpack: file.webpack,
      config: file.config || argv.config
    }
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

  let message
  if (argv.config) {
    message = '  With given webpack configuration\n\n'
  } else {
    message = '  With all dependencies, minified and gzipped\n\n'
  }
  process.stdout.write(chalk.gray(message))
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
