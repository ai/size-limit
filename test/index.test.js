let { join } = require('path')
let del = require('del')
let fs = require('fs')
let os = require('os')

let getSize = require('../')

jest.mock('../get-running-time', () => {
  return () => Promise.resolve(1)
})

function fixture (name) {
  return join(__dirname, 'fixtures', `${ name }.js`)
}

function round (num) {
  return Math.floor(num / 50) * 50
}

const SLOW_3G = 50 * 1024

afterAll(async () => {
  await del(join(os.tmpdir(), 'size-limit-bundle-index'), { force: true })
})

it('returns 0 for parsed and gzip empty project', async () => {
  let size = await getSize(fixture('unlimit/empty'))
  expect(size).toEqual({ gzip: 0, parsed: 0, loading: 0, running: 1 })
})

it('shows project parsed and gzip sizes', async () => {
  let size = await getSize(fixture('bad/index'))
  expect(size).toEqual({
    gzip: 30804, parsed: 100575, loading: 30804 / SLOW_3G, running: 1
  })
})

it('accepts array', async () => {
  let size = await getSize([fixture('bad/index'), fixture('good/index')])
  expect(size.parsed).toEqual(100611)
})

it('returns error', async () => {
  expect.assertions(1)
  try {
    await getSize(fixture('unknown'))
  } catch (e) {
    expect(e.message).toMatch(/Can't resolve/)
  }
})

it('supports ES2016', async () => {
  let size = await getSize(fixture('es2016/index'))
  expect(size.parsed).toEqual(32)
})

it('rounds loading time', async () => {
  let size = await getSize(fixture('es2016/index'))
  expect(size.loading).toEqual(0.01)
})

it('support images', async () => {
  let size = await getSize(fixture('img/index'))
  expect(size.parsed).toEqual(76)
})

it('supports CSS', async () => {
  let size = await getSize(fixture('css/index'))
  expect(round(size.gzip)).toEqual(2350)
})

it('supports CSS modules', async () => {
  let size = await getSize(fixture('cssmodules/index'))
  expect(round(size.gzip)).toEqual(2350)
})

it('supports markdown', async () => {
  let size = await getSize(fixture('markdown/index'))
  expect(size.parsed).toEqual(75)
})

it('removes non-production code', async () => {
  let size = await getSize(fixture('multiple/production'))
  expect(size.parsed).toEqual(3)
})

it('ignores dependencies on request', async () => {
  let size = await getSize(fixture('peer/index'), { ignore: ['redux'] })
  expect(size.parsed).toEqual(83)
})

it('disables webpack on request', async () => {
  let size = await getSize([
    fixture('bad/index'), fixture('es2016/index')
  ], { webpack: false })
  expect(size).toEqual({ parsed: 91, gzip: 113, loading: 0.02, running: 2 })
})

it('disables gzip on request', async () => {
  let size = await getSize(fixture('bad/index'), { gzip: false })
  expect(size).toEqual({
    parsed: 100575, loading: 100575 / SLOW_3G, running: 1
  })
})

it('disables gzip and webpack on request', async () => {
  let size = await getSize(fixture('bad/index'), {
    webpack: false, gzip: false
  })
  expect(size).toEqual({ parsed: 55, loading: 0.01, running: 1 })
})

it('disables running on request', async () => {
  let size = await getSize(fixture('good/index'), { running: false })
  expect(size).toEqual({ gzip: 10, parsed: 14, loading: 0.01 })
})

it('disables gzip and running on request', async () => {
  let size = await getSize(fixture('good/index'), {
    gzip: false, running: false
  })
  expect(size).toEqual({ parsed: 14, loading: 0.01 })
})

it('disables webpack and running on request', async () => {
  let size = await getSize(fixture('bad/index'), {
    webpack: false, running: false
  })
  expect(size).toEqual({ gzip: 57, parsed: 55, loading: 0.01 })
})

it('disables gzip, webpack and running on request', async () => {
  let size = await getSize(fixture('bad/index'), {
    webpack: false, gzip: false, running: false
  })
  expect(size).toEqual({ parsed: 55, loading: 0.01 })
})

it('uses custom webpack config', async () => {
  let size = await getSize(fixture('webpack-config/index'), {
    config: fixture('webpack-config/webpack.config')
  })
  expect(size).toEqual({ parsed: 3085, loading: 3085 / SLOW_3G, running: 1 })
})

it('sums up the size of all multiple entry points assets', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`)
  })
  expect(size).toEqual({ parsed: 21466, loading: 21466 / SLOW_3G, running: 1 })
})

it('sums up the size of assets from specified entry array', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`),
    entry: ['moduleA', 'moduleB']
  })
  expect(size.parsed).toEqual(13990)
})

it('sums up the size of assets from specified entry name', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`),
    entry: 'moduleA'
  })
  expect(size.parsed).toEqual(6514)
})

it('throws error when specified entry points do not exist', async () => {
  expect.assertions(1)
  try {
    await getSize(null, {
      config: fixture(`webpack-multipe-entry-points/webpack.config`),
      entry: 'moduleBad'
    })
  } catch (e) {
    expect(e.message).toContain(
      'Cannot find entry point moduleBad from moduleA, moduleB, moduleC'
    )
  }
})

it('save output bundle to absolute path', async () => {
  let testDir = join(os.tmpdir(), 'size-limit-bundle-index')

  await getSize(fixture('unlimit/empty'), {
    output: testDir
  })

  expect(fs.existsSync(testDir)).toEqual(true)
})
