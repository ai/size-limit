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

  async function withPlugin(files, test) {
    let cwd = await mkdtemp(join(tmpdir(), 'size-limit-plugins-'))
    try {
      let plugin = join(cwd, 'node_modules', 'size-limit-local')
      await mkdir(plugin, { recursive: true })
      for (let [name, content] of Object.entries(files)) {
        await writeFile(join(plugin, name), content)
      }
      await writeFile(
        join(cwd, 'package.json'),
        JSON.stringify({ devDependencies: { 'size-limit-local': '*' } })
      )
      await test(await readPkgUp(cwd))
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  }

  it('loads plugins installed only next to the project', async () => {
    await withPlugin(
      {
        'index.js': "module.exports = { name: 'size-limit-local' }",
        'package.json': JSON.stringify({ main: 'index.js' })
      },
      async pkg => {
        expect((await loadPlugins(pkg)).has('local')).toBe(true)
      }
    )
  })

  it('uses ESM conditions for plugins installed only next to the project', async () => {
    await withPlugin(
      {
        'esm.mjs': "export default { name: 'size-limit-local' }",
        'package.json': JSON.stringify({
          exports: { import: './esm.mjs', require: './cjs.cjs' }
        })
      },
      async pkg => {
        expect((await loadPlugins(pkg)).has('local')).toBe(true)
      }
    )
  })

  it('keeps the original error when the plugin is not installed', async () => {
    await withPlugin({ 'package.json': '{}' }, async pkg => {
      pkg.packageJson.devDependencies = { 'size-limit-missing': '*' }
      await expect(loadPlugins(pkg)).rejects.toMatchObject({
        code: 'ERR_MODULE_NOT_FOUND',
        message: expect.stringContaining('size-limit-missing')
      })
    })
  })

  it('plugins should be empty if no package.json was found', async () => {
    let result = await loadPlugins(await readPkgUp('/'))
    expect(result.isEmpty).toBe(true)
  })
})
