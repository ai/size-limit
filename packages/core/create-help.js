let chalk = require('chalk')

let ownPackage = require('./package.json')

let b = chalk.bold
let y = chalk.yellow

function error (message) {
  let err = new Error(message)
  err.sizeLimit = true
  return err
}

module.exports = process => {
  function print (...lines) {
    process.stdout.write(lines.join('\n') + '\n')
  }

  function showHelp (modules) {
    let isWebpack = modules.some(i => i.name === '@size-limit/webpack')
    print(
      y('size-limit [OPTION]… [FILE]'),
      'Check the real performance cost of your front-end project to users',
      '',
      b('Core options:'),
      `  ${ y('--limit LIMIT') }      Set size or running time limit for files`,
      `  ${ y('--json') }             Show results in JSON format`,
      `  ${ y('--save-bundle DIR') }  Put build files to check them by hand`,
      `  ${ y('--help') }             Display this help`,
      `  ${ y('--version') }          Display version`
    )
    if (isWebpack) {
      print(
        '',
        b('Webpack options:'),
        `  ${ y('--why') }                  Show package content`,
        `  ${ y('--webpack-config FILE') }  Set custom webpack config`
      )
    }
    print(
      '',
      b('Examples:'),
      y('  size-limit'),
      '    Read configuration from package.json or .size-limit and check limit',
      y('  size-limit index.js')
    )
    if (isWebpack) {
      print(
        '    Check the size of specific files with all file dependencies',
        y('  size-limit --why'),
        '    Show reasons why project have this size'
      )
    } else {
      print(
        '    Check the size of specific files'
      )
    }
  }

  function showVersion () {
    print(`size-limit ${ ownPackage.version }`)
  }

  function showMigrationGuide () {
    // TODO
  }

  let errors = {
    noPackage: () => error(
      'Size Limit did’t find `package.json`. ' +
      'Create npm package and run Size Limit there.'
    )
  }

  return { showVersion, showHelp, showMigrationGuide, errors }
}
