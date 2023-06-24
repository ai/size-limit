let {readFile} = require('fs').promises
let [esbuild] = require('@size-limit/esbuild')
let {join} = require('path')
let rm = require('size-limit/rm')
let open = require('open')

jest.mock('open');

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
    checks: [{files: [fixture('big.js')]}],
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
    checks: [{files: [fixture('big.js')]}],
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

  expect(open).toHaveBeenCalledTimes(1);
  expect(open).toHaveBeenCalledWith(expect.stringMatching( /.*\/out\/esbuild-why.html$/));
})
