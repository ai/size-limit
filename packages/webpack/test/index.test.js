import filePkg from '@size-limit/file'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { rm, SizeLimitError } from 'size-limit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import webpackPkg from '../index.js'
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
        size: expect.anything(),
        webpackConfig: config.checks[0].webpackConfig,
        webpackOutput: config.checks[0].webpackOutput
      }
    ]
  })
  expect(config.checks[0].size).toBeCloseTo(2177, -2)
  expect(config.checks[0].webpackOutput).toContain('size-limit-')
  expect(typeof config.checks[0].webpackConfig).toBe('object')
  expect(existsSync(config.checks[0].webpackOutput)).toBe(false)
})

it('supports ignore', async () => {
  let config = {
    checks: [{ files: fixture('cjs/big.js'), ignore: ['redux'] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(154)
})

describe('supports custom webpack config', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/webpack.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(895, -2)
  })

  it('works with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/webpack.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(1295, -2)
  })
})

describe('supports custom webpack config defined as function', () => {
  it('works with cjs', async () => {
    let config = {
      checks: [{ config: fixture('cjs/webpack-func.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(895, -2)
  })

  it('works with esm', async () => {
    let config = {
      checks: [{ config: fixture('esm/webpack-func.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(1295, -2)
  })
})

describe('supports custom webpack config defined as async function', () => {
  it('works with cjs', async () => {
    let config = {
      checks: [{ config: fixture('cjs/webpack-promise.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(895, -2)
  })

  it('works with esm', async () => {
    let config = {
      checks: [{ config: fixture('esm/webpack-promise.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(1295, -2)
  })
})

describe('supports custom entry', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/webpack.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(444, -2)
  })

  it('works with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/webpack.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(647, -1)
  })
})

describe('throws error on unknown entry', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [
        { config: fixture('cjs/webpack.config.js'), entry: ['unknown'] }
      ],
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

  it('works with esm config', async () => {
    let config = {
      checks: [
        { config: fixture('esm/webpack.config.js'), entry: ['unknown'] }
      ],
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
  expect(config.checks[0].size).toBeCloseTo(50, -1)
})

it('allows to disable compression', async () => {
  let config = {
    checks: [{ brotli: false, files: [fixture('cjs/small.js')] }]
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
      brotli: false,
      files: [fixture('esm/module.js')],
      import: {
        [fixture('esm/module.js')]: '{ A }'
      }
    })
  ).toBe(1)

  expect(
    await getSize({
      files: [fixture('esm/module.js')],
      gzip: true,
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
  ).toBeCloseTo(70, -1)
})

it('supports import with multiple files', async () => {
  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '{ A }',
        [fixture('esm/module2.js')]: '{ B }'
      }
    })
  ).toBe(16)
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
  ).toBeCloseTo(70, -1)
})
