import { afterEach, beforeEach, expect, it } from 'vitest'

import calc from '../calc.js'

let before

beforeEach(() => {
  before = process.getMaxListeners()
})

afterEach(() => {
  process.setMaxListeners(before)
})

it('does not lower the process listener limit for a few files', async () => {
  process.setMaxListeners(10)
  let config = { checks: [{ files: ['index.js'] }] }
  await calc({ list: [] }, config, false)
  expect(process.getMaxListeners()).toBe(10)
})

it('raises the process listener limit for many files', async () => {
  process.setMaxListeners(10)
  let files = Array.from({ length: 20 }, (_, i) => `file-${i}.js`)
  let config = { checks: [{ files }] }
  await calc({ list: [] }, config, false)
  expect(process.getMaxListeners()).toBe(21)
})
