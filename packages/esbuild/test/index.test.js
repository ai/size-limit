let SizeLimitError = require('size-limit/size-limit-error')
let { existsSync } = require('fs')
let { join } = require('path')

let [esbuild] = require('..')
let [file] = require('../../file')

const ROOT_CONFIG = join(__dirname, '..', '..', '.size-limit.json')

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

it('uses esbuild to make bundle', async () => {
  let config = {
    checks: [{ files: [fixture('big.js')] }]
  }
  await run(config)
  expect(config).toEqual({
    checks: [
      {
        files: [fixture('big.js')],
        esbuildOutfile: config.checks[0].esbuildOutfile,
        esbuildConfig: config.checks[0].esbuildConfig,
        bundles: [join(config.checks[0].esbuildOutfile, 'big.js')],
        size: 1836
      }
    ]
  })
  expect(config.checks[0].esbuildOutfile).toContain('size-limit-')
  expect(typeof config.checks[0].esbuildConfig).toBe('object')
  expect(existsSync(config.checks[0].esbuildOutfile)).toBe(false)
})

it('supports ignore', async () => {
  let config = {
    checks: [{ files: fixture('big.js'), ignore: ['redux'] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(273)
})

it('supports custom esbuild config', async () => {
  let config = {
    configPath: ROOT_CONFIG,
    checks: [{ config: fixture('esbuild.config.js') }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(162)
})

it('supports custom entry', async () => {
  let config = {
    configPath: ROOT_CONFIG,
    checks: [{ config: fixture('esbuild.config.js'), entry: ['small'] }]
  }
  await run(config)
  expect(config.checks[0].size).toBe(82)
})

it('throws error on unknown entry', async () => {
  let config = {
    configPath: ROOT_CONFIG,
    checks: [{ config: fixture('esbuild.config.js'), entry: ['unknown'] }]
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
