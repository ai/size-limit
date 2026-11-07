import spawn from 'cross-spawn'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const BIN_PATH = join(__dirname, '../bin.js')

function run(args, env = {}, cwd) {
  let cli = spawn(BIN_PATH, args, { cwd, env: { ...process.env, ...env } })
  return new Promise(resolve => {
    let out = ''
    cli.stdout.on('data', data => {
      out += data.toString()
    })
    cli.stderr.on('data', data => {
      out += data.toString()
    })
    cli.on('close', code => {
      resolve({ code, out })
    })
  })
}

it('passes process to runner', async () => {
  let { code, out } = await run(['--version'], {
    TRAVIS: '1',
    TRAVIS_JOB_NUMBER: '1.1'
  })
  expect(out).toMatch(/size-limit \d+.\d+.\d+/)
  expect(code).toBe(0)
})

const BUNDLER_CONFIGS = {
  esbuild: `export default { entryPoints: ['index.js'], outdir: 'out' }`,
  rolldown: `export default { input: 'index.js', output: { dir: 'out' } }`,
  webpack: `export default { entry: './index.js', mode: 'production' }`
}

for (let [bundler, source] of Object.entries(BUNDLER_CONFIGS)) {
  it(`loads a custom ${bundler} config from an absolute path`, async () => {
    let dir = await mkdtemp(join(tmpdir(), 'size-limit-'))
    try {
      // Node.js imports an absolute path as a URL: a Windows drive letter
      // becomes the URL scheme and `#` starts the URL fragment
      await mkdir(join(dir, 'config #1'))
      await writeFile(join(dir, 'config #1', 'bundler.config.mjs'), source)
      await writeFile(join(dir, 'index.js'), 'console.log(1)')
      await writeFile(
        join(dir, 'package.json'),
        JSON.stringify({
          'devDependencies': {
            '@size-limit/file': '*',
            [`@size-limit/${bundler}`]: '*'
          },
          'size-limit': [{ config: 'config #1/bundler.config.mjs' }]
        })
      )
      let { code, out } = await run([], {}, dir)
      expect(out).toContain('Size:')
      expect(code).toBe(0)
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  })
}
