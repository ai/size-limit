import filePkg from '@size-limit/file'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import rm from 'size-limit/rm'
import { SizeLimitError } from 'size-limit/size-limit-error'
import { afterEach, describe, expect, it, vi } from "vitest"

import webpackPkg from '../'
const [file] = filePkg
const [webpack] = webpackPkg

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
    checks: [{ files: [fixture('cjs/big.js')] }]
  }
  await run(config)
  expect(config).toEqual({
    checks: [
      {
        bundles: [join(config.checks[0].webpackOutput, 'index.js')],
        files: [fixture('cjs/big.js')],
        size: 2477,
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
    checks: [{ files: fixture('cjs/big.js'), ignore: ['redux'] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(160)
})


describe('supports custom webpack config', () => {
  it('should work with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/webpack.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBe(1160)
  })

  it('should work with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/webpack.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBe(1605)
  })
})

describe('supports custom entry', () => {
  it('should work with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/webpack.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBe(569)
  })

  it('should work with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/webpack.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBe(792)
  })
})

describe('throws error on unknown entry', () => {
  it('should work with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/webpack.config.js'), entry: ['unknown'] }],
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

  it('should work with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/webpack.config.js'), entry: ['unknown'] }],
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

})

it('allows to disable webpack', async () => {
  let config = {
    checks: [{ files: [fixture('cjs/big.js')], webpack: false }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(55)
})

it('allows to disable gzip', async () => {
  let config = {
    checks: [{ files: [fixture('cjs/small.js')], gzip: false }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(37)
})

it('throws on missed file plugin', async () => {
  let config = {
    checks: [{ files: [fixture('cjs/small.js')] }]
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
    checks: [{ files: [fixture('cjs/small.js')] }],
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
    checks: [{ files: [fixture('cjs/small.js')] }],
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
    checks: [{ files: [fixture('cjs/small.js')] }],
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
      files: [fixture('esm/module.js')],
      import: {
        [fixture('esm/module.js')]: '{ A }'
      }
    })
  ).toBe(1)

  expect(
    await getSize({
      files: [fixture('esm/module.js')],
      gzip: false,
      import: {
        [fixture('esm/module.js')]: '{ A }'
      }
    })
  ).toBe(1)

  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '{ methodA }'
      }
    })
  ).toBe(83)
})

it('supports import with multiple files', async () => {
  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '{ A }',
        [fixture('esm/module2.js')]: '{ B }'
      }
    })
  ).toBe(6)
})

it('can use `modifyWebpackConfig` for resolution of aliases', async () => {
  let { NormalModuleReplacementPlugin } = require('webpack')
  expect(
    await getSize({
      import: {
        [fixture('esm/referencingAlias.js')]: '{ methodA }'
      },
      modifyWebpackConfig(config) {
        config.plugins = [
          new NormalModuleReplacementPlugin(
            /@fixtures\/module/,
            fixture('esm/module.js')
          )
        ]
        return config
      }
    })
  ).toBe(83)
})
