import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import loadPlugins from '../load-plugins'
import readPkgUp from '../read-pkg-up'

describe(`load-plugins`, () => {
  it('load core plugins of size-limit', async () => {
    let cwd = join(__dirname, '..', '..', '..', 'fixtures', 'zero-esbuild')
    let result = await loadPlugins(await readPkgUp(cwd))
    expect(result.isEmpty).toBe(false)
    expect(result.list.length).toBe(2)
    expect(result.has('esbuild')).toBe(true)
    expect(result.has('file')).toBe(true)
    expect(result.has('plugin')).toBe(false)
  })

  it('load 3rd-party plugins', async () => {
    let cwd = join(__dirname, '..', '..', '..', 'fixtures', 'plugins')
    let result = await loadPlugins(await readPkgUp(cwd))
    expect(result.isEmpty).toBe(false)
    expect(result.list.length).toBe(1)
    expect(result.has('esbuild')).toBe(false)
    expect(result.has('file')).toBe(false)
    expect(result.has('node-esbuild')).toBe(true)
  })

  it('plugins should be empty if no package.json was found', async () => {
    let result = await loadPlugins(await readPkgUp('/'))
    expect(result.isEmpty).toBe(true)
  })
})
