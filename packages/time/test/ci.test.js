import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import getRunningTime from '../get-running-time'

vi.mock('estimo', () => ({
  default: () => {
    throw new Error('libX11-xcb.so.1')
  }
}))

vi.mock('../cache', () => ({
  getCache() {
    return false
  },
  saveCache() {}
}))

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => true)
  delete process.env.CI
})

afterEach(() => {
  vi.clearAllMocks()
})

const EXAMPLE = join(__dirname, '../node_modules/nanoid/index.browser.js')

async function runWithError() {
  let err
  try {
    await getRunningTime(EXAMPLE)
  } catch (e) {
    err = e
  }
  return err.message
}

it('prints warning on Circle CI during the error', async () => {
  process.env.CI = '1'
  expect(await runWithError()).toBe('libX11-xcb.so.1')
  expect(console.warn).toHaveBeenCalledTimes(1)
})

it('does not prints warning on non-CI', async () => {
  expect(await runWithError()).toBe('libX11-xcb.so.1')
  expect(console.warn).not.toHaveBeenCalled()
})
