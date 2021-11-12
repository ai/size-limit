let { existsSync } = require('fs')
let { join } = require('path')

let [esbuild] = require('..')
let [file] = require('../../file')

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
