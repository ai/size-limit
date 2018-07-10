#!/usr/bin/env node

const ciJobNumber = require('ci-job-number')
const chalk = require('chalk')

if (ciJobNumber() !== 1) {
  process.stdout.write(
    chalk.yellow('Size Limits run only on first CI job, to save CI resources'))
  process.stdout.write('\n')
  process.exit(0)
}

const cosmiconfig = require('cosmiconfig')
const readPkg = require('read-pkg-up')
const globby = require('globby')
const yargs = require('yargs')
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
  .option('limit', {
    describe: 'Size limit for passed files',
    type: 'string'
  })
  .option('why', {
    alias: 'w',
    describe: 'Show package content',
    type: 'boolean'
  })
  .option('no-webpack', {
    describe: 'Disable webpack',
    type: 'boolean'
  })
  .option('no-gzip', {
    describe: 'Disable gzip',
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

function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1)
}

function renderSize (item, i, array) {
  const rows = []
  const passed = item.limit && item.size <= item.limit
  const failed = item.limit && item.limit < item.size
  const unlimited = !item.limit

  if (array.length > 1 && item.name) {
    rows.push(item.name)
  }

  let limitString = formatBytes(item.limit)
  let sizeString = formatBytes(item.size)

  if (passed) {
    rows.push(
      `Package size: ${ chalk.bold(chalk.green(sizeString)) }`,
      `Size limit:   ${ chalk.bold(limitString) }`
    )
  }

  if (failed) {
    if (limitString === sizeString) {
      limitString = item.limit + ' B'
      sizeString = item.size + ' B'
    }
    const diff = formatBytes(item.size - item.limit)
    rows.push(
      chalk.red('Package size limit has exceeded by ' + diff),
      `Package size: ${ chalk.bold(chalk.red(sizeString)) }`,
      `Size limit:   ${ chalk.bold(limitString) }`
    )
  }

  if (unlimited) {
    rows.push(`Package size: ${ chalk.bold(sizeString) }`)
  }

  return {
    output: rows.map(row => `  ${ row }\n`).join(''),
    failed
  }
}

function getConfig () {
  const explorer = cosmiconfig('size-limit', {
    searchPlaces: [
      'package.json',
      '.size-limit',
      '.size-limit.js'
    ]
  })
  return explorer
    .search()
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
        const regexp = /JSON\s?Error\sin\s[^\n]+:\s+([^\n]+)( while parsing)/
        let message = err.message
        if (regexp.test(message)) {
          message = message.match(regexp)[1]
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

    return Promise.all(config.config.map(entry => {
      const cwd = path.dirname(config.filepath)
      return globby(entry.path, { cwd }).then(files => {
        if (files.length === 0) {
          files = entry.path
          if (typeof files === 'string') files = [files]
        }
        return {
          webpack: entry.webpack !== false,
          config: entry.config,
          limit: bytes.parse(argv.limit || entry.limit),
          gzip: entry.gzip !== false,
          name: entry.name || files.join(', '),
          full: files.map(i => {
            if (path.isAbsolute(i)) {
              return i
            } else {
              return path.join(cwd, i)
            }
          })
        }
      })
    })).then(files => {
      return {
        bundle: packageJson.name,
        ignore: Object.keys(packageJson.peerDependencies || {}),
        files
      }
    })
  })
} else {
  const files = argv['_'].slice(0)

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

    getOptions = Promise.resolve({
      bundle: undefined,
      ignore: [],
      files: [
        {
          webpack: argv.webpack !== false,
          limit: bytes.parse(argv.limit),
          gzip: argv.gzip !== false,
          full
        }
      ]
    })
  }
}

getOptions.then(config => {
  return Promise.all(config.files.map(file => {
    if (file.webpack === false && argv.why) {
      throw ownError(
        '`--why` does not work with `"webpack": false`. ' +
        'Add Webpack Bundle Analyzer to your Webpack config.'
      )
    }

    const opts = {
      bundle: config.bundle,
      ignore: config.ignore,
      webpack: file.webpack,
      config: file.config || argv.config,
      gzip: file.gzip
    }
    if (argv.why && config.files.length === 1) {
      opts.analyzer = process.env['NODE_ENV'] === 'test' ? 'static' : 'server'
    }

    return getSize(file.full, opts).then(size => {
      if (typeof size.gzip === 'number') {
        file.size = size.gzip
      } else {
        file.size = size.parsed
      }
      return file
    })
  })).then(() => config)
}).then(config => {
  const files = config.files
  const results = files.map(renderSize)

  const output = results.map(i => i.output).join('\n')

  process.stdout.write('\n' + output + (files.length > 1 ? '\n' : ''))

  let message
  if (argv.config) {
    message = '  With given webpack configuration\n\n'
  } else {
    message = '  With all dependencies, minified and gzipped\n\n'
  }

  process.stdout.write(chalk.gray(message))

  if (argv.why && files.length > 1) {
    const opts = {
      analyzer: process.env['NODE_ENV'] === 'test' ? 'static' : 'server',
      bundle: config.bundle,
      ignore: config.ignore
    }
    const full = files.reduce((all, i) => all.concat(i.full), [])
    return getSize(full, opts).then(() => files)
  }

  if (!argv.why) {
    if (results.some(i => i.failed)) {
      process.exit(3)
    } else {
      process.exit(0)
    }
  }

  return files
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
