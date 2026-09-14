import { expect, it } from 'vitest'

import { formatBytes, parseBytes } from '../bytes.js'

it('formats bytes with metric units', () => {
  expect(formatBytes(0)).toBe('0 B')
  expect(formatBytes(999)).toBe('999 B')
  expect(formatBytes(1000)).toBe('1 kB')
  expect(formatBytes(97280)).toBe('97.28 kB')
  expect(formatBytes(102400)).toBe('102.4 kB')
  expect(formatBytes(1234567)).toBe('1.23 MB')
  expect(formatBytes(-102400)).toBe('-102.4 kB')
})

it('parses metric and IEC units', () => {
  expect(parseBytes('10')).toBe(10)
  expect(parseBytes('1 B')).toBe(1)
  expect(parseBytes('1 kB')).toBe(1000)
  expect(parseBytes('2.5kB')).toBe(2500)
  expect(parseBytes('1 KiB')).toBe(1024)
  expect(parseBytes('1 MiB')).toBe(1048576)
  expect(parseBytes('-1 kB')).toBe(-1000)
})

it('passes numbers through and rejects garbage', () => {
  expect(parseBytes(1000)).toBe(1000)
  expect(parseBytes('10 apples')).toBeNull()
  expect(parseBytes('')).toBeNull()
})
