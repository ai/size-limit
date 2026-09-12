import filePkg from '@size-limit/file'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SizeLimitError } from 'size-limit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import rolldownPkg from '../index.js'
let [file] = filePkg
let [rolldown] = rolldownPkg

const ROOT_CONFIG = join(__dirname, '..', '..', '.size-limit.json')
// Own directory inside `test/`, so parallel test files do not fight over
// the same `dist` and a leftover build can never be published
const DIST = join(__dirname, 'dist')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

async function run(config) {
  try {
    await rolldown.before(config)
    await rolldown.step20(config, config.checks[0])
    await rolldown.step40(config, config.checks[0])
    await file.step60(config, config.checks[0])
    await rolldown.step61(config, config.checks[0])
  } finally {
    await rolldown.finally(config, config.checks[0])
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
  await rm(DIST, { force: true, recursive: true })
  vi.clearAllMocks()
})

it('uses rolldown to make bundle', async () => {
  let config = {
    checks: [{ files: [fixture('cjs/big.js')] }]
  }
  await run(config)
  expect(config).toEqual({
    checks: [
      {
        bundles: [join(config.checks[0].rolldownOutput, 'big.js')],
        files: [fixture('cjs/big.js')],
        rolldownConfig: config.checks[0].rolldownConfig,
        rolldownOutput: config.checks[0].rolldownOutput,
        size: expect.anything()
      }
    ]
  })
  expect(config.checks[0].size).toBeCloseTo(1820, -2)
  expect(config.checks[0].rolldownOutput).toContain('size-limit-')
  expect(typeof config.checks[0].rolldownConfig).toBe('object')
  expect(existsSync(config.checks[0].rolldownOutput)).toBe(false)
})

it('supports ignore', async () => {
  let config = {
    checks: [{ files: fixture('cjs/big.js'), ignore: ['redux'] }]
  }
  await run(config)
  expect(config.checks[0].size).toBeCloseTo(289, -1)
})

describe('supports custom rolldown config', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/rolldown.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(514, -2)
    expect(config.checks[0].rolldownConfig.write).toBe(true)
  })

  it('works with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/rolldown.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(145, -2)
  })

  it('works with function config', async () => {
    let config = {
      checks: [{ config: fixture('esm/rolldown-func.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(145, -2)
  })

  it('works with promise config', async () => {
    let config = {
      checks: [{ config: fixture('esm/rolldown-promise.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(145, -2)
  })

  it('uses the default output directory', async () => {
    let config = {
      checks: [{ config: fixture('esm/rolldown-no-output.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].bundles).toEqual([join(DIST, 'small.js')])
  })

  it('finds an entry by name when file names are hashed', async () => {
    let config = {
      checks: [
        { config: fixture('esm/rolldown-hashed.config.js'), entry: ['small'] }
      ],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].bundles).toHaveLength(1)
    expect(config.checks[0].bundles[0]).toMatch(/\/small\.\w+\.js$/)
  })

  it('supports a single output file', async () => {
    let config = {
      checks: [{ config: fixture('esm/rolldown-file.config.js') }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].bundles).toEqual([join(DIST, 'out.js')])
  })
})

describe('supports custom entry', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [{ config: fixture('cjs/rolldown.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(325, -1)
  })

  it('works with esm config', async () => {
    let config = {
      checks: [{ config: fixture('esm/rolldown.config.js'), entry: ['small'] }],
      configPath: ROOT_CONFIG
    }
    await run(config)
    expect(config.checks[0].size).toBeCloseTo(70, -1)
  })
})

describe('throws error on unknown entry', () => {
  it('works with commonjs config', async () => {
    let config = {
      checks: [
        { config: fixture('cjs/rolldown.config.js'), entry: ['unknown'] }
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
    expect(existsSync(config.checks[0].rolldownOutput)).toBe(false)
  })

  it('works with esm config', async () => {
    let config = {
      checks: [
        { config: fixture('esm/rolldown.config.js'), entry: ['unknown'] }
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
    expect(existsSync(config.checks[0].rolldownOutput)).toBe(false)
  })
})

it('allows to disable rolldown', async () => {
  let config = {
    checks: [{ files: [fixture('cjs/big.js')], rolldown: false }]
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

it('supports gzip compression', async () => {
  let config = {
    checks: [{ files: [fixture('esm/small.js')], gzip: true }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(18)
})

it('marks check as missed on empty file list', async () => {
  let config = {
    checks: [{ files: [] }]
  }
  await run(config)
  expect(config.checks[0].missed).toBe(true)
  expect(config.checks[0].bundles).toBeUndefined()
})

it('throws on missed file plugin', async () => {
  let config = {
    checks: [{ files: [fixture('cjs/small.js')] }]
  }
  try {
    await rolldown.step20(config, config.checks[0])
    await rolldown.step40(config, config.checks[0])
    let err
    try {
      await rolldown.step61(config, config.checks[0])
    } catch (e) {
      err = e
    }
    expect(err).toEqual(new SizeLimitError('missedPlugin', 'file'))
  } finally {
    await rolldown.finally(config, config.checks[0])
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

  await rolldown.before(config)
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

it('throws on an unresolved import', async () => {
  let config = {
    checks: [{ files: [fixture('esm/unresolved.js')] }]
  }
  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }
  expect(err.message).toContain('no-such-package')
})

it('throws on rolldown error', async () => {
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

it('can use `modifyRolldownConfig` for resolution of aliases', async () => {
  expect(
    await getSize({
      files: [fixture('cjs/big.js')],
      modifyRolldownConfig(config) {
        config.output.minify = false
        return config
      }
    })
  ).toBeCloseTo(7962, -3)
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
  ).toBe(16)
})

it('supports wildcard imports', async () => {
  expect(
    await getSize({
      import: {
        [fixture('esm/module.js')]: '*'
      }
    })
  ).toBeCloseTo(197, -1)
})
