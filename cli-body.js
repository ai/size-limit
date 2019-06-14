let { isAbsolute, relative, join, dirname } = require('path')
let cosmiconfig = require('cosmiconfig')
let readPkg = require('read-pkg-up')
let globby = require('globby')
let yargs = require('yargs')
let bytes = require('bytes')
let chalk = require('chalk')

let getReporter = require('./reporters')
let getSize = require('.')

const PACKAGE_EXAMPLE = '\n' +
                        '  "size-limit": [\n' +
                        '    {\n' +
                        '      "path": "index.js",\n' +
                        '      "limit": "500 ms"\n' +
                        '    }\n' +
                        '  ]'
const FILE_EXAMPLE = '\n' +
                     '  [\n' +
                     '    {\n' +
                     '      path: "index.js",\n' +
                     '      limit: "500 ms"\n' +
                     '    }\n' +
                     '  ]'

let argv = yargs
  .usage('$0')
  .option('limit', {
    describe: 'Size or time limit for passed files',
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
  .option('no-running-time', {
    describe: 'Do not calculate running time',
    type: 'boolean'
  })
  .option('config', {
    describe: 'Custom webpack config',
    type: 'string'
  })
  .option('json', {
    describe: 'Show results in JSON format',
    type: 'boolean'
  })
  .option('save-bundle', {
    describe: 'A path for output bundle',
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

const reporter = getReporter(argv)

function ownError (msg) {
  let error = new Error(msg)
  error.sizeLimit = true
  return error
}

function isStrings (value) {
  if (!Array.isArray(value)) return false
  return value.every(i => typeof i === 'string')
}

let PACKAGE_ERRORS = {
  notArray: 'The `"size-limit"` section of package.json must be `an array`',
  empty: 'The `"size-limit"` section of package.json must `not be empty`',
  notObject: 'The `"size-limit"` array in package.json ' +
             'should contain only objects',
  pathNotString: 'The `path` in the `"size-limit"` section ' +
              'of package.json must be `a string` or `an array of strings`',
  entryNotString: 'The `entry` in the `"size-limit"` section ' +
                  'of package.json must be `a string` or `an array of strings`'
}

let FILE_ERRORS = {
  notArray: 'Size Limit config must contain `an array`',
  empty: 'Size Limit config must `not be empty`',
  notObject: 'Size Limit config should contain only objects',
  pathNotString: 'The `path` in Size Limit config ' +
                 'must be `a string` or `an array of strings`',
  entryNotString: 'The `entry` in Size Limit config ' +
                  'must be `a string` or `an array of strings`'
}

function isStringOrUndefined (value) {
  let type = typeof value
  return type !== 'undefined' && type !== 'string' && !isStrings(value)
}

function configError (limits) {
  if (!Array.isArray(limits)) {
    return 'notArray'
  }
  if (limits.length === 0) {
    return 'empty'
  }
  for (let limit of limits) {
    if (typeof limit !== 'object') {
      return 'notObject'
    }
    if (isStringOrUndefined(limit.path)) {
      return 'pathNotString'
    }
    if (isStringOrUndefined(limit.entry)) {
      return 'entryNotString'
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

function formatTime (seconds) {
  if (seconds >= 1) {
    return (Math.ceil(seconds * 10) / 10) + ' s'
  } else {
    return Math.ceil(seconds * 1000) + ' ms'
  }
}

function renderSize (item, i, array) {
  let rows = []
  let unlimited = !item.limit

  let time = item.loading
  if (item.running) time += item.running

  let passed = true
  if (!unlimited) {
    if (item.limit[0] === 'size') {
      passed = item.limit[1] >= item.size
    } else if (item.limit[0] === 'time') {
      passed = item.limit[1] >= time
    }
  }

  if (array.length > 1 && item.name) {
    rows.push([chalk.bold(item.name)])
  }

  let sizeNote
  if (item.config) {
    sizeNote = 'with given webpack configuration'
  } else if (item.gzip && item.webpack) {
    sizeNote = 'with all dependencies, minified and gzipped'
  } else if (!item.gzip && item.webpack) {
    sizeNote = 'with all dependencies and minified'
  } else if (item.gzip && !item.webpack) {
    sizeNote = 'minified and gzipped'
  } else {
    sizeNote = 'minified'
  }

  let limitString
  let sizeString = formatBytes(item.size)

  if (!unlimited) limitString = formatBytes(item.limit[1])

  if (!passed && !unlimited) {
    if (item.limit[0] === 'size') {
      if (limitString === sizeString) {
        limitString = item.limit[1] + ' B'
        sizeString = item.size + ' B'
      }
      let diff = formatBytes(item.size - item.limit[1])
      rows.push([chalk.red('Package size limit has exceeded by ' + diff)])
    } else {
      rows.push([chalk.red('Total time limit has exceeded')])
    }
  }

  if (!unlimited) {
    if (item.limit[0] === 'size') {
      rows.push(['Size limit:', limitString])
    } else if (item.limit[0] === 'time') {
      rows.push(['Time limit:', formatTime(item.limit[1])])
    }
  }

  rows.push(
    ['Package size:', sizeString, sizeNote],
    ['Loading time:', formatTime(item.loading), 'on slow 3G']
  )
  if (typeof item.running === 'number') {
    rows.push(
      ['Running time:', formatTime(item.running), 'on Snapdragon 410'],
      ['Total time:', formatTime(item.running + item.loading)]
    )
  }

  let multiline = rows.filter(row => row.length > 1)
  let max0 = Math.max(...multiline.map(row => row[0].length))
  let max1 = Math.max(...multiline.map(row => row[1].length))

  let strings = rows.map(row => {
    if (row.length === 1) {
      return row[0]
    } else {
      let str = row[0].padEnd(max0) + ' '
      let second = row[1]
      if (row.length === 3) second = second.padEnd(max1)
      second = chalk.bold(second)
      if (unlimited || row[0] === 'Size limit:') {
        str += second
      } else if (passed) {
        str += chalk.green(second)
      } else {
        str += chalk.red(second)
      }
      if (row.length === 3) {
        str += ' ' + chalk.gray(row[2])
      }
      return str
    }
  })

  return {
    output: strings.map(str => `  ${ str }\n`).join(''),
    file: item,
    failed: !passed
  }
}

async function getConfig () {
  let explorer = cosmiconfig('size-limit', {
    searchPlaces: [
      'package.json',
      '.size-limit.json',
      '.size-limit',
      '.size-limit.js'
    ]
  })
  try {
    let result = await explorer.search()
    if (result === null) {
      throw ownError(
        'Can not find settings for Size Limit. ' +
        'Add it to section `"size-limit"` in package.json ' +
        'according to Size Limit docs.' +
        `\n${ PACKAGE_EXAMPLE }\n`
      )
    }
    return result
  } catch (err) {
    let msg = err.message
    let file = 'config'
    if (msg.indexOf('JSONError') !== -1 || msg.indexOf('JSON Error') !== -1) {
      let pathRegexp = / in ([^\n]+):\n/
      if (pathRegexp.test(msg)) {
        file = msg.match(pathRegexp)[1]
        file = relative(process.cwd(), file)
        file = '`' + file + '`'
      }
      let errorRegexp = /JSON\s?Error([^:]*):\s+([^\n]+)( while parsing)/
      if (errorRegexp.test(msg)) msg = msg.match(errorRegexp)[2]
      throw ownError(
        'Can not parse ' + file + '. ' + msg + '. ' +
        'Change config according to Size Limit docs.\n' +
        PACKAGE_EXAMPLE + '\n'
      )
    } else if (err.reason && err.mark && err.mark.name) {
      file = relative(process.cwd(), err.mark.name)
      let position = err.mark.line + ':' + err.mark.column
      throw ownError(
        'Can not parse `' + file + '` at ' + position + '. ' +
        capitalize(err.reason) + '. ' +
        'Change config according to Size Limit docs.\n' +
        FILE_EXAMPLE + '\n'
      )
    } else {
      throw err
    }
  }
}

async function run () {
  let config, configFile, package
  if (argv['_'].length === 0) {
    [configFile, package] = await Promise.all([
      getConfig(),
      readPkg()
    ])

    let error = configError(configFile.config)
    if (error) {
      if (/package\.json$/.test(configFile.filepath)) {
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

    let result = await Promise.all(configFile.config.map(async entry => {
      if (!package) package = { package: { } }
      let peer = Object.keys(package.package.peerDependencies || { })

      let files = []
      let cwd = process.cwd()
      if (entry.path) {
        cwd = dirname(configFile.filepath)
        files = await globby(entry.path, { cwd })
      } else if (!entry.entry) {
        cwd = dirname(package.path || '.')
        files = [require.resolve(join(cwd, package.package.main || 'index.js'))]
      }

      if (entry.path && files.length === 0) {
        files = entry.path
        if (typeof files === 'string') files = [files]
      }
      return {
        running: entry.running !== false && argv.runningTime !== false,
        webpack: entry.webpack !== false && argv.webpack !== false,
        config: entry.config || argv.config,
        ignore: peer.concat(entry.ignore || []),
        limit: argv.limit || entry.limit,
        gzip: entry.gzip !== false && argv.gzip !== false,
        name: entry.name || entry.entry || files.join(', '),
        full: files.map(i => {
          if (isAbsolute(i)) {
            return i
          } else {
            return join(cwd, i)
          }
        }),
        entry: entry.entry
      }
    }))

    config = { bundle: package.package.name, files: result }
  } else {
    let files = argv['_'].slice(0)

    if (files.length === 0) {
      throw ownError(
        'Specify file for Size Limit. ' +
        `For example, \`size-limit ${ argv['_'] } index.js\`.`
      )
    } else {
      let full = files.map(i => {
        if (isAbsolute(i)) {
          return i
        } else {
          return join(process.cwd(), i)
        }
      })

      config = {
        bundle: undefined,
        files: [
          {
            running: argv.runningTime !== false,
            webpack: argv.webpack !== false,
            config: argv.config,
            ignore: [],
            limit: argv.limit,
            gzip: argv.gzip !== false,
            full
          }
        ]
      }
    }
  }

  await Promise.all(config.files.map(async file => {
    if (file.webpack === false && argv.why) {
      throw ownError(
        '`--why` does not work with `"webpack": false`. ' +
        'Add Webpack Bundle Analyzer to your Webpack config.'
      )
    }

    if (/ ?ms/i.test(file.limit)) {
      file.limit = ['time', parseFloat(file.limit) / 1000]
    } else if (/ ?s/i.test(file.limit)) {
      file.limit = ['time', parseFloat(file.limit)]
    } else if (file.limit) {
      file.limit = ['size', bytes.parse(file.limit)]
    }

    let opts = {
      webpack: file.webpack,
      running: file.running,
      bundle: config.bundle,
      output: argv.saveBundle,
      ignore: file.ignore,
      config: file.config,
      entry: file.entry,
      gzip: file.gzip
    }
    if (argv.why && config.files.length === 1) {
      opts.analyzer = process.env['NODE_ENV'] === 'test' ? 'static' : 'server'
    }

    let size = await getSize(file.full, opts)
    file.size = typeof size.gzip === 'number' ? size.gzip : size.parsed
    file.loading = size.loading
    file.running = size.running
    return file
  }))

  let files = config.files
  let results = files.map(renderSize)
  let failed = results.some(i => i.failed)
  let hint = ''

  if (failed) {
    let fix = 'Try to reduce size or increase limit'
    if (configFile) {
      fix += ' in '
      let configPath = relative(process.cwd(), configFile.filepath)
      if (configPath.endsWith('package.json')) {
        fix += chalk.bold('"size-limit"') + ' section of '
      }
      fix += chalk.bold(configPath)
    }
    hint = chalk.yellow(fix)
  }

  reporter.results(results, hint)

  if (argv.why && files.length > 1) {
    let ignore = files.reduce((all, i) => all.concat(i.ignore), [])
    let opts = {
      analyzer: process.env['NODE_ENV'] === 'test' ? 'static' : 'server',
      bundle: config.bundle,
      output: argv.saveBundle,
      disableModuleConcatenation: true,
      ignore
    }
    let full = files.reduce((all, i) => all.concat(i.full), [])
    await getSize(full, opts)
  } else if (!argv.why) {
    if (failed) {
      process.exit(3)
    } else {
      process.exit(0)
    }
  }

  return files
}

run().catch(e => {
  let msg
  if (e.sizeLimit) {
    msg = e.message
      .split('. ')
      .map(i => i.replace(/`([^`]*)`/g, chalk.bold('$1')))
      .join('.\n        ')
  } else if (e.message.indexOf('Module not found:') !== -1) {
    let first = e.message.match(/Module not found:[^\n]*/)[0]
    msg = `Size Limit c${ first.replace('Module not found: Error: C', '') }`
      .replace(/resolve '(.*)' in '(.*)'/,
        `resolve\n` +
        `        ${ chalk.bold('$1') }\n` +
        `        in ${ chalk.bold('$2') }`
      )
  } else {
    msg = e.stack
  }

  reporter.error(msg)
  process.exit(1)
})
