'use strict'

const path = require('path')

const getSize = require('../')

function fixture (name) {
  return path.join(__dirname, 'fixtures', `${ name }.js`)
}

it('returns 0 for empty project', () => {
  return getSize(fixture('empty')).then(size => {
    expect(size).toEqual(0)
  })
})

it('shows project size', () => {
  return getSize(fixture('big')).then(size => {
    expect(size).toEqual(1905)
  })
})

it('accepts array', () => {
  return getSize([fixture('big'), fixture('index/index')]).then(size => {
    expect(size).toEqual(1918)
  })
})

it('returns error', () => {
  return getSize(fixture('unknown')).catch(e => {
    expect(e.message).toContain('Can\'t resolve')
  })
})
