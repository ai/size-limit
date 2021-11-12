let SizeLimitError = require('size-limit/size-limit-error')
let { nanoid } = require('nanoid/non-secure')
let { tmpdir } = require('os')
let { join, resolve } = require('path')
let rm = require('size-limit/rm')

let runEsbuild = require('./run-esbuild')
let getConfig = require('./get-config')
const { ENOTTY } = require('constants')

function getFiles(buildResult, check) {
  let entries = buildResult.metafile.outputs

  return Object.keys(entries).map(entryPath => resolve(entryPath))
}

let self = {
  name: '@size-limit/esbuild',

  async before(config) {
    return
  },

  async step20(config, check) {
    if (check.esbuild === false) return
    check.esbuildOutfile = config.saveBundle
    if (!check.esbuildOutfile) {
      check.esbuildOutfile = join(tmpdir(), `size-limit-${nanoid()}`)
    }
    if (check.config) {
      check.esbuildConfig = require(check.config)
      convertConfig(check.esbuildConfig, config.configPath)
    } else {
      check.esbuildConfig = await getConfig(config, check, check.esbuildOutfile)
      if (check.modifyEsbuildConfig) {
        check.esbuildConfig = check.modifyEsbuildConfig(check.esbuildConfig)
      }
    }
  },

  wait40: 'Adding to empty esbuild project',
  async step40(config, check) {
    if (check.esbuildConfig && check.esbuild !== false) {
      check.bundles = getFiles(await runEsbuild(check), check)
    }
  },

  async step61(config, check) {
    if (check.bundles) {
      if (typeof check.size === 'undefined') {
        throw new SizeLimitError('missedPlugin', 'file')
      }
    }
  },

  async finally(config, check) {
    if (check.esbuildOutfile && !config.saveBundle) {
      await rm(check.esbuildOutfile)
    }
  }
}

module.exports = [self]
