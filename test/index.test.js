'use strict'

const path = require('path')

const getSize = require('../')

function fixture (name) {
  return path.join(__dirname, 'fixtures', `${ name }.js`)
}

it('returns 0 for empty project', () => {
  return getSize(fixture('unlimit/empty')).then(size => {
    expect(size).toEqual(0)
  })
})

it('shows project size', () => {
  return getSize(fixture('bad/index')).then(size => {
    expect(size).toEqual(2432)
  })
})

it('accepts array', () => {
  return getSize([fixture('bad/index'), fixture('good/index')]).then(size => {
    expect(size).toEqual(2450)
  })
})

it('returns error', () => {
  return getSize(fixture('unknown')).catch(e => {
    expect(e.message).toContain('Can\'t resolve')
  })
})

it('supports Babili', () => {
  return getSize(fixture('es2016/index'), { minifier: 'babili' }).then(size => {
    expect(size).toEqual(39)
  })
})

it('support images', () => {
  return getSize(fixture('img/index')).then(size => {
    expect(size).toEqual(53)
  })
})

it('removes non-production code', () => {
  return getSize(fixture('multiple/production')).then(size => {
    expect(size).toEqual(9)
  })
})
