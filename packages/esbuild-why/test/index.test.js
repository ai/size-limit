let { readFile } = require('fs').promises
let [esbuild] = require('@size-limit/esbuild')
let { join } = require('path')
let rm = require('size-limit/rm')

let [esbuildWhy] = require('..')

const DIST = join(process.cwd(), 'out')

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

afterEach(async () => {
  await rm(DIST)
  jest.clearAllMocks()
})

it('supports --why', async () => {
  jest.spyOn(console, 'log').mockImplementation(() => true)
  let config = {
    project: 'superProject',
    why: true,
    saveBundle: DIST,
    checks: [{ files: [fixture('big.js')] }]
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
