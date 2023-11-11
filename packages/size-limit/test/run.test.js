import { join } from 'node:path'
import { expect, it, vi } from 'vitest'

import run from '../run'

vi.mock('../../time/get-running-time', () => ({
  getRunningTime: () => 1
}))

vi.mock('../../time/cache', () => ({
  getCache() {
    return false
  },
  saveCache() {}
}))

vi.mock('nanospinner', () => {
  return {
    createSpinner() {
      return {
        error() {},
        start() {
          return this
        },
        success() {}
      }
    }
  }
})

const TMP_DIR = /size-limit-[\w-]+\/?/g
const ROOT = join(__dirname, '..', '..', '..')

function fixture(...files) {
  return join(ROOT, 'fixtures', ...files)
}

function createProcess(cwd, args = []) {
  let history = {
    exitCode: 0,
    stderr: '',
    stdout: ''
  }
  let process = {
    argv: ['node', 'size-limit', ...args],
    cwd() {
      if (cwd.includes('/')) {
        return cwd
      } else {
        return fixture(...(Array.isArray(cwd) ? cwd : [cwd]))
      }
    },
    exit(code) {
      history.exitCode = code
    },
    stderr: {
      write(str) {
        history.stderr += str.split(ROOT).join('').replace(TMP_DIR, '')
      }
    },
    stdout: {
      write(str) {
        history.stdout += str.split(ROOT).join('').replace(TMP_DIR, '')
      }
    }
  }
  return [process, history]
}

function clean(output) {
  return output
    .replace(/\d+\.\d+\.\d+/g, '0.0.0')
    .replace(/var\/folders\/(.*)\//g, 'tmp/')
    .replace(/"cwd": "[^"]+"/, '"cwd": "/tmp/"')
    .replace(/"webpackOutput": "[^"]+"/, '"webpackOutput": "/tmp/"')
}

async function check(cwd, args) {
  let [process, history] = createProcess(cwd, args)
  await run(process)
  expect(history.stderr).toBe('')
  expect(history.exitCode).toBe(0)
  return history.stdout
}

async function error(cwd, args) {
  let [process, history] = createProcess(cwd, args)
  await run(process)
  expect(history.stdout).toBe('')
  expect(history.exitCode).toBe(1)
  return history.stderr
}

async function checkJson(cwd, json) {
  expect(clean(await check(cwd, ['--json']))).toEqual(
    JSON.stringify(json, null, '  ') + '\n'
  )
}

it('shows version', async () => {
  let out = await check('file', ['--version'])
  expect(out).toMatch(/^size-limit \d+.\d+.\d+\n$/m)
})

it('shows help', async () => {
  expect(await check('file', ['--help'])).toMatchSnapshot()
})

it('shows webpack-related help', async () => {
  expect(await check('webpack', ['--help'])).toMatchSnapshot()
})

it('uses dependencies to detect plugins', async () => {
  expect(await check('dependencies', ['--help'])).toMatchSnapshot()
})

it('shows error on missed package.json', async () => {
  expect(await error('/')).toMatchSnapshot()
})

it('shows syntax errors in package.json', async () => {
  let stderr = await error('package-syntax')
  expect(stderr).toContain('ERROR')
  expect(stderr).toContain('SyntaxError')
})

it('shows error in JSON format', async () => {
  let [process, history] = createProcess('/', ['--json'])
  await run(process)
  expect(history.exitCode).toBe(1)
  expect(history.stderr).toBe('')
  let output = JSON.parse(history.stdout)
  expect(Object.keys(output)).toEqual(['error'])
  expect(output.error).toContain('SizeLimitError: Size Limit didn’t find')
})

it('shows migration guide for npm users', async () => {
  expect(await error('legacy-npm')).toMatchSnapshot()
})

it('shows migration guide for yarn users', async () => {
  expect(await error('legacy-yarn')).toMatchSnapshot()
})

it('shows migration guide for pnpm users', async () => {
  expect(await error('legacy-pnpm')).toMatchSnapshot()
})

it('shows migration guide for npm users: config 1, dep 0', async () => {
  let [process, history] = createProcess('npm-with-config-without-dev')
  await run(process)
  expect(history.exitCode).toBe(1)
  expect(history.stderr).toMatchSnapshot()
})

it('shows size-limit dependency warning', async () => {
  let [process, history] = createProcess('warn')
  await run(process)
  expect(history.exitCode).toBe(0)
  expect(history.stderr).toMatchSnapshot()
})

it('throws on unknown argument', async () => {
  expect(await error('file', ['--unknown'])).toMatchSnapshot()
})

it('throws on --save-bundle argument without webpack', async () => {
  expect(await error('file', ['--save-bundle'])).toMatchSnapshot()
})

it('throws on --save-bundle argument without DIR parameter', async () => {
  expect(await error('webpack', ['--save-bundle'])).toMatchSnapshot()
  expect(
    await error('webpack', ['--save-bundle', '--clean-dir'])
  ).toMatchSnapshot()
})

it('throws on --clean-dir argument without --save-bundle', async () => {
  expect(await error('file', ['--clean-dir'])).toMatchSnapshot()
})

it('throws on --why argument without webpack', async () => {
  expect(await error('file', ['--why'])).toMatchSnapshot()
})

it('throws on --why argument with esbuild but without esbuild-why', async () => {
  expect(await error('esbuild-why-missing', ['--why'])).toMatchSnapshot()
})

it('throws on --compare-with argument without webpack', async () => {
  expect(await error('file', ['--compare-with'])).toMatchSnapshot()
})

it('throws on --compare-with argument without --why', async () => {
  expect(await error('webpack', ['--compare-with'])).toMatchSnapshot()
})

it('throws on --compare-with argument without value', async () => {
  expect(await error('webpack', ['--why', '--compare-with'])).toMatchSnapshot()
})

it('throws on no config', async () => {
  expect(await error('file')).toMatchSnapshot()
})

it('throws on non-array config', async () => {
  expect(await error('non-array')).toMatchSnapshot()
})

it('throws on empty config', async () => {
  expect(await error('empty')).toMatchSnapshot()
})

it('throws on non-object check', async () => {
  expect(await error('non-object')).toMatchSnapshot()
})

it('throws on non-string path', async () => {
  expect(await error('non-string')).toMatchSnapshot()
})

it('throws on non-string entry', async () => {
  expect(await error('non-string-entry')).toMatchSnapshot()
})

it('throws on webpack option without webpack plugin', async () => {
  expect(await error('non-webpack')).toMatchSnapshot()
  expect(await error('non-webpack-ignore')).toMatchSnapshot()
  expect(await error('non-webpack-config')).toMatchSnapshot()
})

it('throws on gzip option without gzip plugin', async () => {
  expect(await error('non-gzip')).toMatchSnapshot()
})

it('throws on running option without time plugin', async () => {
  expect(await error('non-time')).toMatchSnapshot()
})

it('throws on time limit without time plugin', async () => {
  expect(await error('simple', ['--limit', '1 s'])).toMatchSnapshot()
})

it('throws on unknown option', async () => {
  expect(await error('unknown')).toMatchSnapshot()
})

it('supports path without dot', async () => {
  expect(await check('relative')).toMatchSnapshot()
})

it('works in integration test with JSON', async () => {
  expect(await check('integration', ['--json'])).toMatchSnapshot()
})

it('shows brotli text when only brotli in config', async () => {
  Object.defineProperty(process, 'version', {
    value: 'v11.7.0'
  })
  expect(await check('brotli')).toMatchSnapshot()
})

it('shows brotli text when brotli and gzip in config', async () => {
  Object.defineProperty(process, 'version', {
    value: 'v11.7.0'
  })
  expect(await check('brotli-with-gzip')).toMatchSnapshot()
})

it('works in integration test with size', async () => {
  expect(await check('integration')).toMatchSnapshot()
})

it('works in integration test with ESM', async () => {
  await checkJson('integration-esm', [
    {
      name: 'index.js',
      passed: true,
      size: 1,
      sizeLimit: 1
    },
    {
      name: 'all',
      passed: true,
      size: 39,
      sizeLimit: 39
    }
  ])
})

it('works in integration test with ESM', async () => {
  await checkJson('integration-esm', [
    {
      name: 'index.js',
      passed: true,
      size: 1,
      sizeLimit: 1
    },
    {
      name: 'all',
      passed: true,
      size: 39,
      sizeLimit: 39
    }
  ])
})

it('works in integration test with time', async () => {
  expect(await check('integration', ['--limit', '2s'])).toMatchSnapshot()
})

it('shows error when file not found for simple case', async () => {
  let [process, history] = createProcess('file-not-found')
  await run(process)
  expect(history.exitCode).toBe(1)
  expect(history.stderr).toBe('')
  expect(history.stdout).toMatchSnapshot()
})

it('shows error when file not found for webpack', async () => {
  let [process, history] = createProcess('webpack-no-files')
  await run(process)
  expect(history.exitCode).toBe(1)
  expect(history.stderr).toBe('')
  expect(history.stdout).toMatchSnapshot()
})

it('shows error when using brotli without file', async () => {
  expect(await error('brotli-without-file')).toMatchSnapshot()
})

it('shows error on time bigger than limit', async () => {
  let [process, history] = createProcess('integration', ['--limit', '1 s'])
  await run(process)
  expect(history.exitCode).toBe(1)
  expect(history.stderr).toBe('')
  expect(history.stdout).toMatchSnapshot()
})

it('shows error on time bigger than limit. in silent mode', async () => {
  let [process, history] = createProcess('integration', [
    '--silent',
    '--limit',
    '1 s'
  ])
  await run(process)
  expect(history.exitCode).toBe(1)
  expect(history.stderr).toBe('')
  expect(history.stdout).toMatchSnapshot()
})

it('shows nothing in silent mode and success check', async () => {
  expect(await check('integration', ['--silent'])).toMatchSnapshot()
})

it('returns zero for empty file with webpack', async () => {
  expect(await check('zero-webpack')).toMatchSnapshot()
})

it('returns zero for empty file with webpack without gzip', async () => {
  expect(await check('zero-webpack-non-gzip')).toMatchSnapshot()
})

it('returns zero for empty file with esbuild', async () => {
  expect(await check('zero-esbuild')).toMatchSnapshot()
})

it('returns zero for empty file with esbuild and without gzip', async () => {
  expect(await check('zero-esbuild-non-gzip')).toMatchSnapshot()
})

it('allows to use peer dependencies in import', async () => {
  await checkJson('combine', [
    { name: 'all', size: 2273 },
    { name: 'a', size: 1 },
    { name: 'redux', size: 2270 }
  ])
})

it('supports import and ignore for esbuild', async () => {
  expect(clean(await check('peer-esbuild-non-gzip'))).toMatchSnapshot()
})

it('supports import and ignore for esbuild and gzip', async () => {
  expect(clean(await check('peer-esbuild'))).toMatchSnapshot()
})

it('shows debug', async () => {
  expect(clean(await check('integration', ['--debug']))).toMatchSnapshot()
})

it('shows debug on error', async () => {
  expect(clean(await error('internal-error', ['--debug']))).toMatchSnapshot()
})

it('find plugins in parent package.json', async () => {
  expect(clean(await check(['nested', 'package']))).toMatchSnapshot()
})
