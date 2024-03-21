import filePkg from '@size-limit/file'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { rm, SizeLimitError } from 'size-limit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import esbuildPkg from '../index.js'
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
        size: expect.anything()
      }
    ]
  })
  expect(config.checks[0].size).toBeCloseTo(1938, -2)
  expect(config.checks[0].esbuildOutfile).toContain('size-limit-')
  expect(typeof config.checks[0].esbuildConfig).toBe('object')
  expect(existsSync(config.checks[0].esbuildOutfile)).toBe(false)
})

it('supports bundles with css', async () => {
  let config = {
    checks: [{ files: fixture('esm/nonjs.js') }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(49)
})

it('supports ignore', async () => {
  let config = {
    checks: [{ files: fixture('cjs/big.js'), ignore: ['redux'] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(209)
})

describe('supports custom esbuild config', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/esbuild.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(429, -1)
  })

  it('works with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/esbuild.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(173, -2)
  })
})

describe('supports custom entry', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/esbuild.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(204, -1)
  })

  it('works with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/esbuild.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(61, -1)
  })
})

describe('throws error on unknown entry', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [
        { config: fixture('cjs/esbuild.config.js'), entry: ['unknown'] }
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
        { config: fixture('esm/esbuild.config.js'), entry: ['unknown'] }
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

it('allows to disable esbuild', async () => {
  let config = {
    checks: [{ esbuild: false, files: [fixture('cjs/big.js')] }]
  }
  await run(config)
  expect(config.checks[0].size).toBeCloseTo(50, -1)
})

it('allows to disable compression', async () => {
  let config = {
    checks: [{ brotli: false, files: [fixture('esm/small.js')] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(37)
})

it('throws on missed file plugin', async () => {
  let config = {
    checks: [{ files: [fixture('cjs/small.js')] }]
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
    checks: [{ files: [fixture('cjs/small.js')] }],
    saveBundle: DIST
  }
  await run(config)
  expect(existsSync(join(DIST, 'small.js'))).toBe(true)
})

it('supports --clean-dir', async () => {
  let dist = join(DIST, 'small.js')
  let config = {
    checks: [{ files: [fixture('cjs/small.js')] }],
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
  let distFile = join(DIST, 'small.js')
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
  ).toBeCloseTo(1938, -2)
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
  ).toBe(9)

  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '{ methodA }'
      }
    })
  ).toBe(87)
})

it('supports import with multiple files', async () => {
  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '{ A }',
        [fixture('esm/module2.js')]: '{ B }'
      }
    })
  ).toBe(30)
})

it('supports wildcard imports', async () => {
  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '*'
      }
    })
  ).toBeCloseTo(167, -1)
})
