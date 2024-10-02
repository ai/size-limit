import { nanoid } from 'nanoid/non-secure'
import { readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, parse, resolve } from 'node:path'
import { SizeLimitError } from 'size-limit'

import { convertConfig } from './convert-config.js'
import { getConfig } from './get-config.js'
import { runEsbuild } from './run-esbuild.js'

const ESBUILD_EMPTY_PROJECT = 12
const ESBUILD_EMPTY_PROJECT_GZIP = 32
const ESBUILD_EMPTY_PROJECT_BROTLI = 16
const ESBUILD_EMPTY_PROJECT_IMPORT = 34
const ESBUILD_EMPTY_PROJECT_IMPORT_GZIP = 46
const ESBUILD_EMPTY_PROJECT_IMPORT_BROTLI = 30
const ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE = 331
const ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE_GZIP = 182
const ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE_BROTLI = 182

function getFiles(buildResult, check) {
  let entries = {}
  let outputs = buildResult.metafile.outputs

  for (let key in outputs) {
    let outputEntryName = parse(key).base
    outputs[outputEntryName] = outputs[key]
    outputs[outputEntryName].path = resolve(key)
    delete outputs[key]
  }

  if (check.entry) {
    for (let entry of check.entry) {
      let matches = Object.keys(outputs).filter(
        key => parse(key).name === entry
      )
      if (matches.length === 0) {
        throw new SizeLimitError('unknownEntry', entry)
      }
      for (let match of matches) {
        entries[match] = outputs[match]
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
          await rm(config.saveBundle, { force: true, recursive: true })
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
        await rm(check.esbuildOutfile, { force: true, recursive: true })
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
        if (hasRequirePolyfill && check.import) {
          if (check.gzip === true) {
            check.size -= ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE_GZIP
          } else if (check.brotli === false) {
            check.size -= ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE
          } else {
            check.size -= ESBUILD_EMPTY_PROJECT_IMPORT_IGNORE_BROTLI
          }
        } else if (check.import) {
          if (check.gzip === true) {
            check.size -= ESBUILD_EMPTY_PROJECT_IMPORT_GZIP
          } else if (check.brotli === false) {
            check.size -= ESBUILD_EMPTY_PROJECT_IMPORT
          } else {
            check.size -= ESBUILD_EMPTY_PROJECT_IMPORT_BROTLI
          }
        } else if (check.gzip === true) {
          check.size -= ESBUILD_EMPTY_PROJECT_GZIP
        } else if (check.brotli === false) {
          check.size -= ESBUILD_EMPTY_PROJECT
        } else {
          check.size -= ESBUILD_EMPTY_PROJECT_BROTLI
        }
      }
    },

    wait40: 'Adding to empty esbuild project'
  }
]
