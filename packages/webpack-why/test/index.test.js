let { writeFile, readFile, mkdir } = require('fs').promises
let { existsSync } = require('fs')
let [webpack] = require('@size-limit/webpack')
let { join } = require('path')
let [file] = require('@size-limit/file')
let rm = require('size-limit/rm')

let [webpackWhy] = require('../')

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
  let { DefinePlugin } = require('webpack')
  let plugin = new DefinePlugin({
    TEST: 'true'
  })
  let config = {
    project: 'superProject',
    why: true,
    saveBundle: DIST,
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
    saveBundle: DIST,
    checks: [{ files: [fixture('small.js')] }]
  }
  await run(config)
  expect(existsSync(join(DIST, 'index.js'))).toBe(true)
  expect(existsSync(join(DIST, 'stats.json'))).toBe(true)
})

it('throws unsupported error --save-bundle', async () => {
  let distFile = join(DIST, 'index.js')
  let config = {
    saveBundle: distFile,
    checks: [{ files: [fixture('small.js')] }]
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
