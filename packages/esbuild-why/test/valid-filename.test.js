import { expect, it } from 'vitest'

import { isValidFilename } from '../valid-filename.js'

it('main', () => {
  expect(isValidFilename('foo-bar')).toBe(true)
  expect(isValidFilename('foo/bar')).toBe(false)
  expect(isValidFilename('')).toBe(false)
  expect(isValidFilename('<foo|bar>')).toBe(false)
  expect(isValidFilename('con')).toBe(false)
  expect(isValidFilename('aux')).toBe(false)
  expect(isValidFilename('com1')).toBe(false)
  expect(isValidFilename('lpt1')).toBe(false)
  expect(isValidFilename('nul1')).toBe(true)
  expect(isValidFilename('aux1')).toBe(true)
  expect(isValidFilename('a'.repeat(255))).toBe(true)
  expect(isValidFilename('a'.repeat(256))).toBe(false)
  expect(isValidFilename('.')).toBe(false)
  expect(isValidFilename('..')).toBe(false)
  expect(isValidFilename('...')).toBe(true)
})
