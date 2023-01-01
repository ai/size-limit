let { writeFile, readFile, mkdir } = require('fs').promises
let { existsSync } = require('fs')
let [esbuild] = require('@size-limit/esbuild')
let { join } = require('path')
let [file] = require('@size-limit/file')
let rm = require('size-limit/rm')

let [esbuildWhy] = require('..')

const DIST = join(process.cwd(), 'out')

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
    await esbuildWhy.step81(config, checks[0])
  } finally {
    await esbuild.finally(config, config.checks[0])
  }
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

    // let reportFile = join(config.checks[0].esbuildOutfile, 'report.html')
    // let reportHTML = await readFile(reportFile)
    // expect(reportHTML.toString()).toContain('superProject')
  } finally {
    await esbuild.finally(config, config.checks[0])
  }
})
