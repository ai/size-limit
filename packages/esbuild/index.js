import { nanoid } from 'nanoid/non-secure'
import { readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, parse, resolve } from 'node:path'
import { rm, SizeLimitError } from 'size-limit'

import { convertConfig } from './convert-config.js'
import { getConfig } from './get-config.js'
import { runEsbuild } from './run-esbuild.js'

const ESBUILD_EMPTY_PROJECT = 12
const ESBUILD_EMPTY_PROJECT_GZIP = 32
const ESBUILD_EMPTY_PROJECT_IMPORT = 34
const ESBUILD_EMPTY_PROJECT_IMPORT_GZIP = 46
const ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE = 331
const ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE_GRIP = 182

function getFiles(buildResult, check) {
  let entries = {}
  let outputs = buildResult.metafile.outputs

  for (let key in outputs) {
    let outputEntryName = parse(key).name
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
      if (check.esbuildOutfile && !config.saveBundle) {
        await rm(check.esbuildOutfile)
      }
    },

    name: '@size-limit/esbuild',

    async step20(config, check) {
      if (check.esbuild === false) return
      check.esbuildOutfile = config.saveBundle
      if (!check.esbuildOutfile) {
        check.esbuildOutfile = join(tmpdir(), `size-limit-${nanoid()}`)
      }
      if (check.config) {
        check.esbuildConfig = (await import(check.config)).default
        convertConfig(check.esbuildConfig, config.configPath)
      } else {
        check.esbuildConfig = await getConfig(
          config,
          check,
          check.esbuildOutfile
        )
        if (check.modifyEsbuildConfig) {
          check.esbuildConfig = check.modifyEsbuildConfig(check.esbuildConfig)
        }
      }
    },
    async step40(config, check) {
      if (check.esbuildConfig && check.esbuild !== false) {
        let result = await runEsbuild(check)
        check.esbuildMetafile = result.metafile
        check.bundles = getFiles(result, check)
      }
    },

    async step61(config, check) {
      if (check.bundles) {
        if (typeof check.size === 'undefined') {
          throw new SizeLimitError('missedPlugin', 'file')
        }
        let hasRequirePolyfill = false
        if (check.ignore) {
          for (let bundle of check.bundles) {
            let js = await readFile(bundle)
            if (js.toString().includes('Dynamic require of ')) {
              hasRequirePolyfill = true
            }
          }
        }
        if (hasRequirePolyfill && check.import && check.gzip === false) {
          check.size -= ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE
        } else if (hasRequirePolyfill && check.import) {
          check.size -= ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE_GRIP
        } else if (check.import && check.gzip === false) {
          check.size -= ESBUILD_EMPTY_PROJECT_IMPORT
        } else if (check.import) {
          check.size -= ESBUILD_EMPTY_PROJECT_IMPORT_GZIP
        } else if (check.gzip === false) {
          check.size -= ESBUILD_EMPTY_PROJECT
        } else {
          check.size -= ESBUILD_EMPTY_PROJECT_GZIP
        }
      }
    },

    wait40: 'Adding to empty esbuild project'
  }
]
