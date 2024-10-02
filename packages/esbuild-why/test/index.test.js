import esbuildPkg from '@size-limit/esbuild'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import open from 'open'
import { afterEach, expect, it, vi } from 'vitest'

import esbuildWhyPkg from '..'
const [esbuild] = esbuildPkg

vi.mock('open')
const [esbuildWhy] = esbuildWhyPkg

const DIST = join(process.cwd(), 'out')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

afterEach(async () => {
  await rm(DIST, { force: true, recursive: true })
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
    await esbuild.before(config)
    await esbuild.step20(config, config.checks[0])
    await esbuild.step40(config, config.checks[0])
    await esbuildWhy.step81(config, config.checks[0])

    let reportFile = join(config.checks[0].esbuildOutfile, 'esbuild-why.html')
    let reportHTML = await readFile(reportFile)
    expect(reportHTML.toString()).toContain('EsBuild Visualizer')
  } finally {
    await esbuild.finally(config, config.checks[0])
  }
})

it('supports open esbuild visualizer on complete', async () => {
  let config = {
    checks: [{ files: [fixture('big.js')] }],
    project: 'superProject',
    saveBundle: DIST,
    why: true
  }
  try {
    await esbuild.before(config)
    await esbuild.step20(config, config.checks[0])
    await esbuild.step40(config, config.checks[0])
    await esbuildWhy.step81(config, config.checks[0])
  } finally {
    await esbuild.finally(config, config.checks[0])
    await esbuildWhy.finally(config, config.checks[0])
  }

  expect(open).toHaveBeenCalledTimes(1)
  expect(open).toHaveBeenCalledWith(
    expect.stringMatching(/.*\/out\/esbuild-why.html$/)
  )
})
