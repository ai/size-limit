'use strict'

const path = require('path')

const getSize = require('../')

function project (name) {
  return path.join(__dirname, 'fixtures', `${ name }.js`)
}

it('returns 0 for empty project', () => {
  return getSize(project('empty')).then(size => {
    expect(size).toEqual(0)
  })
})

it('shows project size', () => {
  return getSize(project('big')).then(size => {
    expect(size).toEqual(1905)
  })
})

it('returns error', () => {
  return getSize(project('unknown')).catch(e => {
    expect(e.message).toContain('Can\'t resolve')
  })
})
