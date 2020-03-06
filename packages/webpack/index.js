let SizeLimitError = require('size-limit/size-limit-error')
let { promisify } = require('util')
let { tmpdir } = require('os')
let { join } = require('path')
let rimraf = promisify(require('rimraf'))
let nanoid = require('nanoid')

let convertConfig = require('./convert-config')
let runWebpack = require('./run-webpack')
let getConfig = require('./get-config')

const WEBPACK_EMPTY_PROJECT = 962
const WEBPACK_EMPTY_PROJECT_GZIP = 461
const WEBPACK_EMPTY_PROJECT_IMPORT = 967
const WEBPACK_EMPTY_PROJECT_IMPORT_GZIP = 475

function getFiles (stats, check) {
  let entries = { }
  if (check.entry) {
    for (let i of check.entry) {
      if (stats.entrypoints[i]) {
        entries[i] = stats.entrypoints[i]
      } else {
        throw new SizeLimitError('unknownEntry', i)
      }
    }
  } else {
    entries = stats.entrypoints
  }

  return Object.keys(entries)
    .reduce((assets, i) => assets.concat(entries[i].assets), [])
    .map(i => {
      if (check.webpackConfig.output && check.webpackConfig.output.path) {
        return join(check.webpackConfig.output.path, i)
      } else {
        return join(process.cwd(), 'dist', i)
      }
    })
}

let self = {
  name: '@size-limit/webpack',

  step20 (config, check) {
    if (check.webpack === false) return
    check.webpackOutput = config.saveBundle
    if (!check.webpackOutput) {
      check.webpackOutput = join(tmpdir(), `size-limit-${ nanoid() }`)
    }
    if (check.config) {
      check.webpackConfig = require(check.config)
      convertConfig(check.webpackConfig, config.configPath)
    } else {
      check.webpackConfig = getConfig(config, check, check.webpackOutput)
    }
  },

  wait40: 'Adding your library to empty webpack project',
  async step40 (config, check) {
    if (check.webpackConfig) {
      check.bundles = getFiles(await runWebpack(check), check)
    }
  },

  async step61 (config, check) {
    if (check.bundles) {
      if (typeof check.size === 'undefined') {
        throw new SizeLimitError('missedPlugin', 'file')
      }
      if (check.import && check.gzip === false) {
        check.size -= WEBPACK_EMPTY_PROJECT_IMPORT
      } else if (check.import) {
        check.size -= WEBPACK_EMPTY_PROJECT_IMPORT_GZIP
      } else if (check.gzip === false) {
        check.size -= WEBPACK_EMPTY_PROJECT
      } else {
        check.size -= WEBPACK_EMPTY_PROJECT_GZIP
      }
    }
  },

  async finally (config, check) {
    if (check.webpackOutput && !config.saveBundle) {
      await rimraf(check.webpackOutput)
    }
  }
}

module.exports = [self]
