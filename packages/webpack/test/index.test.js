let SizeLimitError = require('size-limit/size-limit-error')
let { existsSync } = require('fs')
let { promisify } = require('util')
let { join } = require('path')
let readFile = promisify(require('fs').readFile)
let writeFile = promisify(require('fs').writeFile)
let mkdir = promisify(require('fs').mkdir)
let rimraf = promisify(require('rimraf'))

let [webpack] = require('../')
let [file] = require('../../file')

const ROOT_CONFIG = join(__dirname, '..', '..', '.size-limit.json')
const DIST = join(process.cwd(), 'dist')

function fixture (name) {
  return join(__dirname, 'fixtures', name)
}

async function run (config) {
  try {
    await webpack.before(config)
    await webpack.step20(config, config.checks[0])
    await webpack.step40(config, config.checks[0])
    await file.step60(config, config.checks[0])
    await webpack.step61(config, config.checks[0])
  } finally {
    await webpack.finally(config, config.checks[0])
  }
}

async function getSize (check) {
  let config = {
    checks: [check]
  }
  await run(config)
  return config.checks[0].size
}

afterEach(async () => {
  await rimraf(DIST)
  jest.clearAllMocks()
})

it('uses webpack to make bundle', async () => {
  let config = {
    checks: [
      { path: [fixture('big.js')] }
    ]
  }
  await run(config)
  expect(config).toEqual({
    checks: [
      {
        path: [fixture('big.js')],
        webpackOutput: config.checks[0].webpackOutput,
        webpackConfig: config.checks[0].webpackConfig,
        bundles: [join(config.checks[0].webpackOutput, 'index.js')],
        size: 2849
      }
    ]
  })
  expect(config.checks[0].webpackOutput).toContain('size-limit-')
  expect(typeof config.checks[0].webpackConfig).toEqual('object')
  expect(existsSync(config.checks[0].webpackOutput)).toBe(false)
})

it('supports non-JS require', async () => {
  let config = {
    checks: [
      { path: [fixture('nonjs.js')] }
    ]
  }
  await run(config)
  expect(config.checks[0].size).toBeGreaterThan(1450)
  expect(config.checks[0].size).toBeLessThan(1700)
})

it('supports ignore', async () => {
  let config = {
    checks: [
      { path: fixture('big.js'), ignore: ['redux'] }
    ]
  }
  await run(config)
  expect(config.checks[0].size).toEqual(27)
})

it('supports custom webpack config', async () => {
  let config = {
    configPath: ROOT_CONFIG,
    checks: [
      { config: fixture('webpack.config.js') }
    ]
  }
  await run(config)
  expect(config.checks[0].size).toEqual(1840)
})

it('supports custom entry', async () => {
  let config = {
    configPath: ROOT_CONFIG,
    checks: [
      { config: fixture('webpack.config.js'), entry: ['small'] }
    ]
  }
  await run(config)
  expect(config.checks[0].size).toEqual(688)
})

it('throws error on unknown entry', async () => {
  let config = {
    configPath: ROOT_CONFIG,
    checks: [
      { config: fixture('webpack.config.js'), entry: ['unknown'] }
    ]
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

it('allows to disable webpack', async () => {
  let config = {
    checks: [
      { path: [fixture('big.js')], webpack: false }
    ]
  }
  await run(config)
  expect(config.checks[0].size).toEqual(55)
})

it('allows to disable gzip', async () => {
  let config = {
    checks: [
      { path: [fixture('small.js')], gzip: false }
    ]
  }
  await run(config)
  expect(config.checks[0].size).toEqual(36)
})

it('throws on missed file plugin', async () => {
  let config = {
    checks: [
      { path: [fixture('small.js')] }
    ]
  }
  try {
    await webpack.step20(config, config.checks[0])
    await webpack.step40(config, config.checks[0])
    let err
    try {
      await webpack.step61(config, config.checks[0])
    } catch (e) {
      err = e
    }
    expect(err).toEqual(new SizeLimitError('missedPlugin', 'file'))
  } finally {
    await webpack.finally(config, config.checks[0])
  }
})

it('supports --why', async () => {
  jest.spyOn(console, 'log').mockImplementation(() => true)
  let config = {
    project: 'superProject',
    why: true,
    checks: [
      { path: [fixture('big.js')] }
    ]
  }
  try {
    await webpack.step20(config, config.checks[0])
    await webpack.step40(config, config.checks[0])
    let reportFile = join(config.checks[0].webpackOutput, 'report.html')
    let reportHTML = await readFile(reportFile)
    expect(reportHTML.toString()).toContain('superProject')
  } finally {
    await webpack.finally(config, config.checks[0])
  }
})

it('supports --save-bundle', async () => {
  let config = {
    saveBundle: DIST,
    checks: [
      { path: [fixture('small.js')] }
    ]
  }
  await run(config)
  expect(existsSync(join(DIST, 'index.js'))).toBe(true)
})

it('supports --clean-dir', async () => {
  let dist = join(DIST, 'index.js')
  let config = {
    saveBundle: DIST,
    cleanDir: true,
    checks: [
      { path: [fixture('small.js')] }
    ]
  }
  await run(config)
  expect(existsSync(dist)).toBe(true)

  await webpack.before(config)
  expect(existsSync(dist)).toBe(false)
})

it('throws error on not empty bundle dir', async () => {
  let dist = join(DIST, 'index.js')
  let config = {
    saveBundle: DIST,
    checks: [
      { path: [fixture('small.js')] }
    ]
  }
  await run(config)
  expect(existsSync(dist)).toBe(true)

  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }

  expect(err).toEqual(new SizeLimitError('bundleDirNotEmpty', DIST))
})

it('throws unsupported error --save-bundle', async () => {
  let distFile = join(DIST, 'index.js')
  let config = {
    saveBundle: distFile,
    checks: [
      { path: [fixture('small.js')] }
    ]
  }
  await mkdir(DIST)
  await writeFile(distFile, '')

  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }
  expect(err.code).toEqual('ENOTDIR')
})

it('throws on webpack error', async () => {
  let config = {
    checks: [
      { path: [fixture('unknown.js')] }
    ]
  }
  let err
  try {
    await run(config)
  } catch (e) {
    err = e
  }
  expect(err.message).toContain('unknown.js')
})

it('supports specifying the import', async () => {
  expect(
    await getSize({
      path: [fixture('module.js')],
      import: {
        [fixture('module.js')]: '{ A }'
      }
    })
  ).toEqual(1)

  expect(
    await getSize({
      path: [fixture('module.js')],
      import: {
        [fixture('module.js')]: '{ A }'
      },
      gzip: false
    })
  ).toEqual(1)

  expect(
    await getSize({
      import: {
        [fixture('module.js')]: '{ methodA }'
      }
    })
  ).toEqual(79)
})

it('supports import with multiple files', async () => {
  expect(
    await getSize({
      import: {
        [fixture('module.js')]: '{ A }',
        [fixture('module2.js')]: '{ B }'
      }
    })
  ).toEqual(5)
})
