import { readdir } from 'fs/promises'
import { nanoid } from 'nanoid/non-secure'
import { tmpdir } from 'os'
import { join } from 'path'
import rm from 'size-limit/rm'
import { SizeLimitError } from 'size-limit/size-limit-error'

import { convertConfig } from './convert-config'
import { getConfig } from './get-config'
import { runWebpack } from './run-webpack'

const WEBPACK_EMPTY_PROJECT = 0
const WEBPACK_EMPTY_PROJECT_GZIP = 20
const WEBPACK_EMPTY_PROJECT_IMPORT = 37
const WEBPACK_EMPTY_PROJECT_IMPORT_GZIP = 57

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
        check.webpackConfig = (await import(check.config)).default
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

    wait40: 'Adding to empty webpack project'
  }
]
