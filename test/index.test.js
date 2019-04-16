let path = require('path')

let getSize = require('../')

function fixture (name) {
  return path.join(__dirname, 'fixtures', `${ name }.js`)
}

function round (num) {
  return Math.floor(num / 50) * 50
}

it('returns 0 for parsed and gzip empty project', async () => {
  let size = await getSize(fixture('unlimit/empty'))
  expect(size).toEqual({ gzip: 0, parsed: 0 })
})

it('shows project parsed and gzip sizes', async () => {
  let size = await getSize(fixture('bad/index'))
  expect(size).toEqual({ gzip: 2431, parsed: 7113 })
})

it('accepts array', async () => {
  let size = await getSize([fixture('bad/index'), fixture('good/index')])
  expect(size).toEqual({ gzip: 2447, parsed: 7148 })
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
  expect(size).toEqual({ gzip: 25, parsed: 32 })
})

it('support images', async () => {
  let size = await getSize(fixture('img/index'))
  expect(size).toEqual({ gzip: 43, parsed: 76 })
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
  expect(size).toEqual({ gzip: 43, parsed: 75 })
})

it('removes non-production code', async () => {
  let size = await getSize(fixture('multiple/production'))
  expect(size).toEqual({ gzip: 1, parsed: 3 })
})

it('ignores dependencies on request', async () => {
  let size = await getSize(fixture('peer/index'), { ignore: ['redux'] })
  expect(size).toEqual({ gzip: 22, parsed: 83 })
})

it('disables webpack on request', async () => {
  let size = await getSize([
    fixture('bad/index'), fixture('es2016/index')
  ], { webpack: false })
  expect(size).toEqual({ gzip: 93, parsed: 53 })
})

it('disables gzip on request', async () => {
  let size = await getSize([fixture('bad/index')], { gzip: false })
  expect(size).toEqual({ parsed: 7113 })
})

it('disables gzip and webpack on request', async () => {
  let size = await getSize([
    fixture('bad/index')
  ], { webpack: false, gzip: false })
  expect(size).toEqual({ parsed: 17 })
})

it('uses custom webpack config', async () => {
  let size = await getSize(fixture('webpack-config/index'), {
    config: fixture('webpack-config/webpack.config')
  })
  expect(size).toEqual({ parsed: 3085 })
})

it('sums up the size of all multiple entry points assets', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`)
  })
  expect(size).toEqual({ parsed: 21466 })
})

it('sums up the size of assets from specified entry array', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`),
    entry: ['moduleA', 'moduleB']
  })
  expect(size).toEqual({ parsed: 13990 })
})

it('sums up the size of assets from specified entry name', async () => {
  let size = await getSize(null, {
    config: fixture(`webpack-multipe-entry-points/webpack.config`),
    entry: 'moduleA'
  })
  expect(size).toEqual({ parsed: 6514 })
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
