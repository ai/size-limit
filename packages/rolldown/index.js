import { randomUUID } from 'node:crypto'
import { readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, parse, resolve } from 'node:path'
import { SizeLimitError } from 'size-limit'

import { convertConfig } from './convert-config.js'
import { getConfig } from './get-config.js'
import { runRolldown } from './run-rolldown.js'

const ROLLDOWN_EMPTY_PROJECT = 0
const ROLLDOWN_EMPTY_PROJECT_GZIP = 20
const ROLLDOWN_EMPTY_PROJECT_BROTLI = 1
const ROLLDOWN_EMPTY_PROJECT_IMPORT = 14
const ROLLDOWN_EMPTY_PROJECT_IMPORT_GZIP = 34
const ROLLDOWN_EMPTY_PROJECT_IMPORT_BROTLI = 18

function getOutputDir(config) {
  let cwd = config.cwd || process.cwd()
  let output = config.output || {}
  // Rolldown ignores `output.dir` when `output.file` is set
  if (output.file) return dirname(resolve(cwd, output.file))
  if (output.dir) return resolve(cwd, output.dir)
  return join(cwd, 'dist')
}

function getFiles(buildResult, check) {
  let dir = getOutputDir(check.rolldownConfig)
  let files = buildResult.output.map(asset => ({
    fileName: asset.fileName,
    imports: asset.imports || [],
    // Chunks keep the entry name even when file names are hashed
    name: asset.name || parse(asset.fileName).name,
    path: join(dir, asset.fileName)
  }))

  let bundles = new Set()
  if (check.entry) {
    let byFileName = new Map(files.map(i => [i.fileName, i]))
    // An entry can be split into several chunks, and all of them are loaded
    let add = file => {
      if (bundles.has(file.path)) return
      bundles.add(file.path)
      for (let imported of file.imports) {
        let chunk = byFileName.get(imported)
        if (chunk) add(chunk)
      }
    }
    for (let entry of check.entry) {
      let matches = files.filter(i => i.name === entry)
      if (matches.length === 0) {
        throw new SizeLimitError('unknownEntry', entry)
      }
      for (let match of matches) add(match)
    }
  } else {
    for (let file of files) bundles.add(file.path)
  }

  return [...bundles]
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
      if (check.rolldownOutput && !config.saveBundle) {
        await rm(check.rolldownOutput, { force: true, recursive: true })
      }
    },

    name: '@size-limit/rolldown',

    async step20(config, check) {
      if (check.rolldown === false) return
      check.rolldownOutput = config.saveBundle
      if (!check.rolldownOutput) {
        check.rolldownOutput = join(tmpdir(), `size-limit-${randomUUID()}`)
      }
      if (check.config) {
        let configModule = await import(check.config)
        check.rolldownConfig = await loadConfig(configModule.default)
        convertConfig(check.rolldownConfig, config.configPath)
      } else {
        check.rolldownConfig = await getConfig(
          config,
          check,
          check.rolldownOutput
        )
        if (check.modifyRolldownConfig) {
          check.rolldownConfig = check.modifyRolldownConfig(
            check.rolldownConfig
          )
        }
      }
    },
    async step40(config, check) {
      if (check.rolldownConfig && check.rolldown !== false) {
        check.bundles = getFiles(await runRolldown(check), check)
      }
    },

    async step61(config, check) {
      if (check.bundles) {
        if (typeof check.size === 'undefined') {
          throw new SizeLimitError('missedPlugin', 'file')
        }
        if (check.import) {
          if (check.gzip === true) {
            check.size -= ROLLDOWN_EMPTY_PROJECT_IMPORT_GZIP
          } else if (check.brotli === false) {
            check.size -= ROLLDOWN_EMPTY_PROJECT_IMPORT
          } else {
            check.size -= ROLLDOWN_EMPTY_PROJECT_IMPORT_BROTLI
          }
        } else if (check.gzip === true) {
          check.size -= ROLLDOWN_EMPTY_PROJECT_GZIP
        } else if (check.brotli === false) {
          check.size -= ROLLDOWN_EMPTY_PROJECT
        } else {
          check.size -= ROLLDOWN_EMPTY_PROJECT_BROTLI
        }
      }
    },

    wait40: 'Adding to empty rolldown project'
  }
]
