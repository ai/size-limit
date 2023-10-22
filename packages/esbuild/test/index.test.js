import filePkg from '@size-limit/file'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import rm from 'size-limit/rm'
import { SizeLimitError } from 'size-limit/size-limit-error'
import { afterEach, describe, expect, it, vi } from "vitest"

import esbuildPkg from '../'
const [file] = filePkg
const [esbuild] = esbuildPkg

const ROOT_CONFIG = join(__dirname, '..', '..', '.size-limit.json')
const DIST = join(process.cwd(), 'dist')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

async function run(config) {
  try {
    await esbuild.before(config)
    await esbuild.step20(config, config.checks[0])
    await esbuild.step40(config, config.checks[0])
    await file.step60(config, config.checks[0])
    await esbuild.step61(config, config.checks[0])
  } finally {
    await esbuild.finally(config, config.checks[0])
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

it('uses esbuild to make bundle', async () => {
  let config = {
    checks: [{ files: [fixture('cjs/big.js')] }]
  }
  await run(config)
  expect(config).toEqual({
    checks: [
      {
        bundles: [join(config.checks[0].esbuildOutfile, 'big.js')],
        esbuildConfig: config.checks[0].esbuildConfig,
        esbuildMetafile: config.checks[0].esbuildMetafile,
        esbuildOutfile: config.checks[0].esbuildOutfile,
        files: [fixture('cjs/big.js')],
        size: 2286
      }
    ]
  })
  expect(config.checks[0].esbuildOutfile).toContain('size-limit-')
  expect(typeof config.checks[0].esbuildConfig).toBe('object')
  expect(existsSync(config.checks[0].esbuildOutfile)).toBe(false)
})

it('supports ignore', async () => {
  let config = {
    checks: [{ files: fixture('cjs/big.js'), ignore: ['redux'] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(439)
})

describe('supports custom esbuild config', () => {
  it('should work with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/esbuild.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBe(163)
  })

  it('should work with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/esbuild.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBe(163)
  })
})

describe('supports custom entry', () => {
  it('should work with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/esbuild.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBe(66)
  })

  it('should work with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/esbuild.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBe(66)
  })
})

describe('throws error on unknown entry', () => {
  it('should work with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/esbuild.config.js'), entry: ['unknown'] }],
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
      checks: [{ config: fixture('esm/esbuild.config.js'), entry: ['unknown'] }],
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

it('allows to disable esbuild', async () => {
  let config = {
    checks: [{ esbuild: false, files: [fixture('cjs/big.js')] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(56)
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
    await esbuild.step20(config, config.checks[0])
    await esbuild.step40(config, config.checks[0])
    let err
    try {
      await esbuild.step61(config, config.checks[0])
    } catch (e) {
      err = e
    }
    expect(err).toEqual(new SizeLimitError('missedPlugin', 'file'))
  } finally {
    await esbuild.finally(config, config.checks[0])
  }
})

it('supports --save-bundle', async () => {
  let config = {
    checks: [{ files: [fixture('small.js')] }],
    saveBundle: DIST
  }
  await run(config)
  expect(existsSync(join(DIST, 'small.js'))).toBe(true)
})

it('supports --clean-dir', async () => {
  let dist = join(DIST, 'small.js')
  let config = {
    checks: [{ files: [fixture('small.js')] }],
    cleanDir: true,
    saveBundle: DIST
  }

  await run(config)
  expect(existsSync(dist)).toBe(true)

  await esbuild.before(config)
  expect(existsSync(dist)).toBe(false)
})

it('throws error on not empty bundle dir', async () => {
  let dist = join(DIST, 'small.js')
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
  let distFile = join(DIST, 'small.js')
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

it('throws on esbuild error', async () => {
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

it('can use `modifyEsbuildConfig` for resolution of aliases', async () => {
  expect(
    await getSize({
      files: [fixture('cjs/big.js')],
      modifyEsbuildConfig(config) {
        config.minify = false
        return config
      }
    })
  ).toBe(2286)
})

it('supports specifying the import', async () => {
  expect(
    await getSize({
      files: [fixture('esm/module.js')],
      import: {
        [fixture('esm/module.js')]: '{ A }'
      }
    })
  ).toBe(9)

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
  ).toBe(86)
})

it('supports import with multiple files', async () => {
  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '{ A }',
        [fixture('esm/module2.js')]: '{ B }'
      }
    })
  ).toBe(18)
})

it('supports wildcard imports', async () => {
  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '*'
      }
    })
  ).toBe(191)
})
