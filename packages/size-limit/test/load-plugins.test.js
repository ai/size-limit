import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import loadPlugins from '../load-plugins'
import readPkgUp from '../read-pkg-up'

describe(`load-plugins`, () => {
  it('load core plugins of size-limit', async () => {
    let cwd = join(__dirname, '..', '..', '..', 'fixtures', 'zero-esbuild')
    let result = await loadPlugins(await readPkgUp(cwd))
    expect(result.isEmpty).toBe(false)
    expect(result.list.length).toBe(3)
    expect(result.has('esbuild')).toBe(true)
    expect(result.has('file')).toBe(true)
    expect(result.has('webpack-css')).toBe(true)
    expect(result.has('plugin')).toBe(false)
  })

  it('load 3rd-party plugins', async () => {
    let cwd = join(__dirname, '..', '..', '..', 'fixtures', 'plugins')
    let result = await loadPlugins(await readPkgUp(cwd))
    expect(result.isEmpty).toBe(false)
    expect(result.list.length).toBe(1)
    expect(result.has('esbuild')).toBe(true)
    expect(result.has('file')).toBe(false)
    expect(result.has('node-esbuild')).toBe(false)
  })

  it('loads plugins installed only next to the project', async () => {
    let cwd = await mkdtemp(join(tmpdir(), 'size-limit-plugins-'))
    try {
      let plugin = join(cwd, 'node_modules', 'size-limit-local')
      await mkdir(plugin, { recursive: true })
      await writeFile(
        join(plugin, 'package.json'),
        JSON.stringify({ name: 'size-limit-local', main: 'index.js' })
      )
      await writeFile(
        join(plugin, 'index.js'),
        "module.exports = { name: 'size-limit-local' }"
      )
      await writeFile(
        join(cwd, 'package.json'),
        JSON.stringify({ devDependencies: { 'size-limit-local': '*' } })
      )
      let result = await loadPlugins(await readPkgUp(cwd))
      expect(result.has('local')).toBe(true)
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  })

  it('plugins should be empty if no package.json was found', async () => {
    let result = await loadPlugins(await readPkgUp('/'))
    expect(result.isEmpty).toBe(true)
  })
})
