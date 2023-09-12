import filePlugins from '@size-limit/file'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import rm from 'size-limit/rm'
import SizeLimitError from 'size-limit/size-limit-error'
import { afterEach, expect, it, vi } from 'vitest'

import webpackPlugins from '../'
let [file] = filePlugins

let [webpack] = webpackPlugins

const ROOT_CONFIG = join(__dirname, '..', '..', '.size-limit.json')
const DIST = join(process.cwd(), 'dist')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

async function run(config) {
  try {
    await webpack.before(config)
    await webpack.step20(config, config.checks[0])
    await webpack.step40(config, config.checks[0])
    await file.step60(config, config.checks[0])
    await webpack.step61(config, config.checks[0])
  } finally {
    await webpack.finally(config, config.checks[0])
  }
}

async function getSize(check) {
  let config = {
    checks: [check]
  }
  await run(config)
  return config.checks[0].size
}

afterEach(async () => {
  await rm(DIST)
  vi.clearAllMocks()
})

it('uses webpack to make bundle', async () => {
  let config = {
    checks: [{ files: [fixture('big.js')] }]
  }
  await run(config)
  expect(config).toEqual({
    checks: [
      {
        bundles: [join(config.checks[0].webpackOutput, 'index.js')],
        files: [fixture('big.js')],
        size: 2480,
        webpackConfig: config.checks[0].webpackConfig,
        webpackOutput: config.checks[0].webpackOutput
      }
    ]
  })
  expect(config.checks[0].webpackOutput).toContain('size-limit-')
  expect(typeof config.checks[0].webpackConfig).toBe('object')
  expect(existsSync(config.checks[0].webpackOutput)).toBe(false)
})

it('supports ignore', async () => {
  let config = {
    checks: [{ files: fixture('big.js'), ignore: ['redux'] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(160)
})

it('supports custom webpack config', async () => {
  let config = {
    checks: [{ config: fixture('webpack.config.js') }],
    configPath: ROOT_CONFIG
  }
  await run(config)
  expect(config.checks[0].size).toBe(1154)
})

it('supports custom entry', async () => {
  let config = {
    checks: [{ config: fixture('webpack.config.js'), entry: ['small'] }],
    configPath: ROOT_CONFIG
  }
  await run(config)
  expect(config.checks[0].size).toBe(566)
})

it('throws error on unknown entry', async () => {
  let config = {
    checks: [{ config: fixture('webpack.config.js'), entry: ['unknown'] }],
    configPath: ROOT_CONFIG
  }
  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }
  expect(err).toEqual(new SizeLimitError('unknownEntry', 'unknown'))
  expect(existsSync(config.checks[0].webpackOutput)).toBe(false)
})

it('allows to disable webpack', async () => {
  let config = {
    checks: [{ files: [fixture('big.js')], webpack: false }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(55)
})

it('allows to disable gzip', async () => {
  let config = {
    checks: [{ files: [fixture('small.js')], gzip: false }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(37)
})

it('throws on missed file plugin', async () => {
  let config = {
    checks: [{ files: [fixture('small.js')] }]
  }
  try {
    await webpack.step20(config, config.checks[0])
    await webpack.step40(config, config.checks[0])
    let err
    try {
      await webpack.step61(config, config.checks[0])
    } catch (e) {
      err = e
    }
    expect(err).toEqual(new SizeLimitError('missedPlugin', 'file'))
  } finally {
    await webpack.finally(config, config.checks[0])
  }
})

it('supports --clean-dir', async () => {
  let dist = join(DIST, 'index.js')
  let config = {
    checks: [{ files: [fixture('small.js')] }],
    cleanDir: true,
    saveBundle: DIST
  }
  await run(config)
  expect(existsSync(dist)).toBe(true)

  await webpack.before(config)
  expect(existsSync(dist)).toBe(false)
})

it('throws error on not empty bundle dir', async () => {
  let dist = join(DIST, 'index.js')
  let config = {
    checks: [{ files: [fixture('small.js')] }],
    saveBundle: DIST
  }
  await run(config)
  expect(existsSync(dist)).toBe(true)

  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }

  expect(err).toEqual(new SizeLimitError('bundleDirNotEmpty', DIST))
})

it('throws unsupported error --save-bundle', async () => {
  let distFile = join(DIST, 'index.js')
  let config = {
    checks: [{ files: [fixture('small.js')] }],
    saveBundle: distFile
  }
  await mkdir(DIST)
  await writeFile(distFile, '')

  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }
  expect(err.code).toBe('ENOTDIR')
})

it('throws on webpack error', async () => {
  let config = {
    checks: [{ files: [fixture('unknown.js')] }]
  }
  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }
  expect(err.message).toContain('unknown.js')
})

it('supports specifying the import', async () => {
  expect(
    await getSize({
      files: [fixture('module.js')],
      import: {
        [fixture('module.js')]: '{ A }'
      }
    })
  ).toBe(1)

  expect(
    await getSize({
      files: [fixture('module.js')],
      gzip: false,
      import: {
        [fixture('module.js')]: '{ A }'
      }
    })
  ).toBe(1)

  expect(
    await getSize({
      import: {
        [fixture('module.js')]: '{ methodA }'
      }
    })
  ).toBe(83)
})

it('supports import with multiple files', async () => {
  expect(
    await getSize({
      import: {
        [fixture('module.js')]: '{ A }',
        [fixture('module2.js')]: '{ B }'
      }
    })
  ).toBe(6)
})

it('can use `modifyWebpackConfig` for resolution of aliases', async () => {
  let { NormalModuleReplacementPlugin } = await import('webpack')
  expect(
    await getSize({
      import: {
        [fixture('referencingAlias.js')]: '{ methodA }'
      },
      modifyWebpackConfig(config) {
        config.plugins = [
          new NormalModuleReplacementPlugin(
            /@fixtures\/module/,
            fixture('module.js')
          )
        ]
        return config
      }
    })
  ).toBe(83)
})
