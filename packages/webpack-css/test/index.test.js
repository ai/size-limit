import filePlugins from '@size-limit/file'
import webpackPlugins from '@size-limit/webpack'
import { join } from 'node:path'
import rm from 'size-limit/rm'
import { afterEach, expect, it, vi } from 'vitest'

import webpackCssPlugins from '../'
let [webpack] = webpackPlugins
let [file] = filePlugins

let [webpackCss] = webpackCssPlugins

const DIST = join(process.cwd(), 'dist')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

async function run(config) {
  try {
    await webpackCss.before(config, config.checks[0])
    await webpack.before(config)
    await webpack.step20(config, config.checks[0])
    await webpack.step40(config, config.checks[0])
    await file.step60(config, config.checks[0])
    await webpack.step61(config, config.checks[0])
  } finally {
    await webpack.finally(config, config.checks[0])
  }
}
afterEach(async () => {
  await rm(DIST)
  vi.clearAllMocks()
})

it('supports non-JS require', async () => {
  let config = {
    checks: [{ files: [fixture('nonjs.js')] }]
  }
  await run(config)
  expect(config.checks[0].size).toBeGreaterThan(1450)
  expect(config.checks[0].size).toBeLessThan(2400)
})

it('applies both `modifyWebpackConfig`', async () => {
  let { DefinePlugin } = await import('webpack')
  let plugin = new DefinePlugin({
    TEST: 'true'
  })
  let config = {
    checks: [
      {
        files: [fixture('big.js')],
        modifyWebpackConfig: webpackConfig => {
          webpackConfig.plugins.push(plugin)
          return webpackConfig
        }
      }
    ]
  }

  try {
    await webpackCss.before(config, config.checks[0])
    await webpack.step20(config, config.checks[0])

    let webpackConfig = config.checks[0].webpackConfig

    expect(webpackConfig.plugins).toContain(plugin)
  } finally {
    await webpack.finally(config, config.checks[0])
  }
})
