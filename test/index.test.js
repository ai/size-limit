let path = require('path')

let getSize = require('../')

function fixture (name) {
  return path.join(__dirname, 'fixtures', `${ name }.js`)
}

function round (num) {
  return Math.floor(num / 50) * 50
}

const SLOW_3G = 50 * 1024

it('returns 0 for parsed and gzip empty project', async () => {
  let size = await getSize(fixture('unlimit/empty'))
  expect(size).toEqual({ gzip: 0, parsed: 0, loading: 0 })
})

it('shows project parsed and gzip sizes', async () => {
  let size = await getSize(fixture('bad/index'))
  expect(size).toEqual({
    gzip: 30804, parsed: 100575, loading: 30804 / SLOW_3G
  })
})

it('accepts array', async () => {
  let size = await getSize([fixture('bad/index'), fixture('good/index')])
  expect(size).toEqual({
    gzip: 30818, parsed: 100611, loading: 30818 / SLOW_3G
  })
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
  expect(size).toEqual({ gzip: 25, parsed: 32, loading: 25 / SLOW_3G })
})

it('support images', async () => {
  let size = await getSize(fixture('img/index'))
  expect(size).toEqual({ gzip: 43, parsed: 76, loading: 43 / SLOW_3G })
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
  expect(size).toEqual({ gzip: 43, parsed: 75, loading: 43 / SLOW_3G })
})

it('removes non-production code', async () => {
  let size = await getSize(fixture('multiple/production'))
  expect(size).toEqual({ gzip: 1, parsed: 3, loading: 1 / SLOW_3G })
})

it('ignores dependencies on request', async () => {
  let size = await getSize(fixture('peer/index'), { ignore: ['redux'] })
  expect(size).toEqual({ gzip: 22, parsed: 83, loading: 22 / SLOW_3G })
})

it('disables webpack on request', async () => {
  let size = await getSize([
    fixture('bad/index'), fixture('es2016/index')
  ], { webpack: false })
  expect(size).toEqual({
    gzip: 113, parsed: 91, loading: 113 / SLOW_3G
  })
})

it('disables gzip on request', async () => {
  let size = await getSize([fixture('bad/index')], { gzip: false })
  expect(size).toEqual({ parsed: 100575, loading: 100575 / SLOW_3G })
})

it('disables gzip and webpack on request', async () => {
  let size = await getSize([
    fixture('bad/index')
  ], { webpack: false, gzip: false })
  expect(size).toEqual({ parsed: 55, loading: 55 / SLOW_3G })
})

it('uses custom webpack config', async () => {
  let size = await getSize(fixture('webpack-config/index'), {
    config: fixture('webpack-config/webpack.config')
  })
  expect(size).toEqual({ parsed: 3085, loading: 3085 / SLOW_3G })
})

it('sums up the size of all multiple entry points assets', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`)
  })
  expect(size).toEqual({ parsed: 21466, loading: 21466 / SLOW_3G })
})

it('sums up the size of assets from specified entry array', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`),
    entry: ['moduleA', 'moduleB']
  })
  expect(size).toEqual({ parsed: 13990, loading: 13990 / SLOW_3G })
})

it('sums up the size of assets from specified entry name', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`),
    entry: 'moduleA'
  })
  expect(size).toEqual({ parsed: 6514, loading: 6514 / SLOW_3G })
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
