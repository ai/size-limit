import filePlugins from '@size-limit/file'
import webpackPlugins from '@size-limit/webpack'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import rm from 'size-limit/rm'
import { afterEach, expect, it, vi } from 'vitest'

import webpackWhyPlugins from '../'

let [webpack] = webpackPlugins
let [file] = filePlugins
let [webpackWhy] = webpackWhyPlugins

const DIST = join(process.cwd(), 'out')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

async function run(config) {
  try {
    await webpackWhy.before(config, config.checks[0])
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

it('supports --why', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => true)
  let config = {
    checks: [{ files: [fixture('big.js')] }],
    project: 'superProject',
    saveBundle: DIST,
    why: true
  }
  try {
    await webpackWhy.before(config, config.checks[0])
    await webpack.step20(config, config.checks[0])
    await webpack.step40(config, config.checks[0])

    let reportFile = join(config.checks[0].webpackOutput, 'report.html')
    let reportHTML = await readFile(reportFile)
    expect(reportHTML.toString()).toContain('<body>')
  } finally {
    await webpack.finally(config, config.checks[0])
  }
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
    ],
    project: 'superProject',
    saveBundle: DIST,
    why: true
  }

  try {
    await webpackWhy.before(config, config.checks[0])
    await webpack.step20(config, config.checks[0])

    let webpackConfig = config.checks[0].webpackConfig

    expect(webpackConfig.plugins).toContain(plugin)
  } finally {
    await webpack.finally(config, config.checks[0])
  }
})

it('supports --save-bundle', async () => {
  let config = {
    checks: [{ files: [fixture('small.js')] }],
    saveBundle: DIST
  }
  await run(config)
  expect(existsSync(join(DIST, 'index.js'))).toBe(true)
  expect(existsSync(join(DIST, 'stats.json'))).toBe(true)
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
