let SizeLimitError = require('size-limit/size-limit-error')
let { readdir } = require('fs').promises
let { nanoid } = require('nanoid/non-secure')
let { tmpdir } = require('os')
let { join, resolve, parse } = require('path')
let rm = require('size-limit/rm')

let convertConfig = require('./convert-config')
let runEsbuild = require('./run-esbuild')
let getConfig = require('./get-config')

// @@todo: handle custom configs with write: false (in this case we'll get file size immediately)
// @@todo: dist is a just folder with builded files provided, what about bundle?
function getFiles(buildResult, check) {
  let entries = {}
  const outputs = buildResult.metafile.outputs

  for (const key in outputs) {
    const outputEntryName = parse(key).name
    outputs[outputEntryName] = outputs[key]
    outputs[outputEntryName].path = resolve(key)
    delete outputs[key]
  }

  if (check.entry) {
    for (let i of check.entry) {
      if (outputs[i]) {
        entries[i] = outputs[i]
      } else {
        throw new SizeLimitError('unknownEntry', i)
      }
    }
  } else {
    entries = outputs
  }

  return Object.values(entries).map(({ path }) => path)
}

async function isDirNotEmpty(dir) {
  try {
    let files = await readdir(dir)
    return !!files.length
  } catch (e) {
    if (e.code === 'ENOENT') return false
    throw e
  }
}

let self = {
  name: '@size-limit/esbuild',

  async before(config) {
    if (config.saveBundle) {
      if (config.cleanDir) {
        await rm(config.saveBundle)
      } else {
        let notEmpty = await isDirNotEmpty(config.saveBundle)
        if (notEmpty) {
          throw new SizeLimitError('bundleDirNotEmpty', config.saveBundle)
        }
      }
    }
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
