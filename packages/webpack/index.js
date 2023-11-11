import { nanoid } from 'nanoid/non-secure'
import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rm, SizeLimitError } from 'size-limit'

import { convertConfig } from './convert-config.js'
import { getConfig } from './get-config.js'
import { runWebpack } from './run-webpack.js'

const WEBPACK_EMPTY_PROJECT = 0
const WEBPACK_EMPTY_PROJECT_GZIP = 20
const WEBPACK_EMPTY_PROJECT_BROTLI = 1
const WEBPACK_EMPTY_PROJECT_IMPORT = 37
const WEBPACK_EMPTY_PROJECT_IMPORT_GZIP = 57
const WEBPACK_EMPTY_PROJECT_IMPORT_BROTLI = 41

function getFiles(stats, check) {
  let entries = {}
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
    .map(({ name }) => {
      if (check.webpackConfig.output && check.webpackConfig.output.path) {
        return join(check.webpackConfig.output.path, name)
      } else {
        return join(process.cwd(), 'dist', name)
      }
    })
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

async function loadConfig(config) {
  return typeof config === 'function' ? config() : config
}

export default [
  {
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

    async finally(config, check) {
      if (check.webpackOutput && !config.saveBundle) {
        await rm(check.webpackOutput)
      }
    },

    name: '@size-limit/webpack',

    async step20(config, check) {
      if (check.webpack === false) return
      check.webpackOutput = config.saveBundle
      if (!check.webpackOutput) {
        check.webpackOutput = join(tmpdir(), `size-limit-${nanoid()}`)
      }
      if (check.config) {
        let configModule = await import(check.config)
        check.webpackConfig = await loadConfig(configModule.default)
        convertConfig(check.webpackConfig, config.configPath)
      } else {
        check.webpackConfig = await getConfig(
          config,
          check,
          check.webpackOutput
        )
        if (check.modifyWebpackConfig) {
          check.webpackConfig = check.modifyWebpackConfig(check.webpackConfig)
        }
      }
    },
    async step40(config, check) {
      if (check.webpackConfig && check.webpack !== false) {
        check.bundles = getFiles(await runWebpack(check), check)
      }
    },

    async step61(config, check) {
      if (check.bundles) {
        if (typeof check.size === 'undefined') {
          throw new SizeLimitError('missedPlugin', 'file')
        }
        if (check.import) {
          if (check.gzip === true) {
            check.size -= WEBPACK_EMPTY_PROJECT_IMPORT_GZIP
          } else if (check.brotli === false) {
            check.size -= WEBPACK_EMPTY_PROJECT_IMPORT
          } else {
            check.size -= WEBPACK_EMPTY_PROJECT_IMPORT_BROTLI
          }
        } else if (check.gzip === true) {
          check.size -= WEBPACK_EMPTY_PROJECT_GZIP
        } else if (check.brotli === false) {
          check.size -= WEBPACK_EMPTY_PROJECT
        } else {
          check.size -= WEBPACK_EMPTY_PROJECT_BROTLI
        }
      }
    },

    wait40: 'Adding to empty webpack project'
  }
]
