import rolldownPkg from '@size-limit/rolldown'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import open from 'open'
import { afterEach, expect, it, vi } from 'vitest'

import rolldownWhyPkg from '..'
let [rolldown] = rolldownPkg

vi.mock('open')
let [rolldownWhy] = rolldownWhyPkg

// Own directory inside `test/`, so parallel test files do not fight over
// the same `dist` and a leftover report can never be published
const DIST = join(__dirname, 'dist')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

async function run(config) {
  try {
    await rolldown.before(config)
    await rolldown.step20(config, config.checks[0])
    await rolldownWhy.step30(config, config.checks[0])
    await rolldown.step40(config, config.checks[0])
  } finally {
    await rolldown.finally(config, config.checks[0])
  }
}

afterEach(async () => {
  await rm(DIST, { force: true, recursive: true })
  vi.clearAllMocks()
})

it('supports --why', async () => {
  let config = {
    checks: [{ files: [fixture('big.js')] }],
    project: 'superProject',
    saveBundle: DIST,
    why: true
  }
  await run(config)

  let reportFile = join(DIST, 'rolldown-why.html')
  expect(config.checks[0].rolldownVisualizerFile).toBe(reportFile)

  let reportHTML = (await readFile(reportFile)).toString()
  expect(reportHTML).toContain('<title>superProject</title>')
  expect(reportHTML).toContain('redux')
})

it('does not change the measured bundle', async () => {
  await run({
    checks: [{ files: [fixture('big.js')] }],
    saveBundle: DIST
  })
  let plain = await readFile(join(DIST, 'big.js'))
  await rm(DIST, { force: true, recursive: true })

  await run({
    checks: [{ files: [fixture('big.js')] }],
    project: 'superProject',
    saveBundle: DIST,
    why: true
  })
  let withReport = await readFile(join(DIST, 'big.js'))

  expect(plain.length).toBeGreaterThan(0)
  expect(withReport.equals(plain)).toBe(true)
})

it('opens the report on complete', async () => {
  let config = {
    checks: [{ files: [fixture('big.js')] }],
    project: 'superProject',
    saveBundle: DIST,
    why: true
  }
  try {
    await run(config)
  } finally {
    await rolldownWhy.finally(config, config.checks[0])
  }

  expect(open).toHaveBeenCalledTimes(1)
  expect(open).toHaveBeenCalledWith(
    expect.stringMatching(/.*\/dist\/rolldown-why\.html$/)
  )
})

it('does nothing without --why', async () => {
  let config = {
    checks: [{ files: [fixture('big.js')] }],
    saveBundle: DIST
  }
  try {
    await run(config)
    await rolldownWhy.finally(config, config.checks[0])
  } finally {
    await rm(DIST, { force: true, recursive: true })
  }

  expect(config.checks[0].rolldownVisualizerFile).toBeUndefined()
  expect(open).not.toHaveBeenCalled()
})

it('does not add the analyzer to the imported config module', async () => {
  let file = fixture('custom.config.js')
  let imported = (await import(file)).default
  let plugins = imported.plugins

  for (let i = 0; i < 2; i++) {
    await run({
      checks: [{ config: file }],
      cleanDir: true,
      project: 'superProject',
      saveBundle: DIST,
      why: true
    })
  }

  expect((await import(file)).default.plugins).toBe(plugins)
})

it('does not open a report when the build failed', async () => {
  let config = {
    checks: [{ files: [fixture('unknown.js')] }],
    project: 'superProject',
    saveBundle: DIST,
    why: true
  }
  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }
  await rolldownWhy.finally(config, config.checks[0])

  expect(err).toBeDefined()
  expect(config.checks[0].rolldownVisualizerFile).toBeDefined()
  expect(open).not.toHaveBeenCalled()
})

it('does nothing when rolldown is disabled', async () => {
  let config = {
    checks: [{ files: [fixture('big.js')], rolldown: false }],
    why: true
  }
  await run(config)
  await rolldownWhy.finally(config, config.checks[0])

  expect(config.checks[0].rolldownVisualizerFile).toBeUndefined()
  expect(open).not.toHaveBeenCalled()
})
