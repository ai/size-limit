let { join } = require('path')

let run = require('../run')

jest.mock('../../time/get-running-time', () => () => 1)
jest.mock('../../time/cache', () => ({
  getCache () {
    return false
  },
  saveCache () { }
}))

const TMP_DIR = /size-limit-[\w-]+\/?/g
const ROOT = join(__dirname, '..', '..', '..')

function fixture (...files) {
  return join(__dirname, 'fixtures', ...files)
}

function createProcess (cwd, args = []) {
  let history = {
    exitCode: 0,
    stdout: '',
    stderr: ''
  }
  let process = {
    argv: ['node', 'size-limit', ...args],
    cwd () {
      if (cwd.includes('/')) {
        return cwd
      } else {
        return fixture(cwd)
      }
    },
    exit (code) {
      history.exitCode = code
    },
    stdout: {
      write (str) {
        history.stdout += str.split(ROOT).join('').replace(TMP_DIR, '')
      }
    },
    stderr: {
      write (str) {
        history.stderr += str.split(ROOT).join('').replace(TMP_DIR, '')
      }
    }
  }
  return [process, history]
}

function normalize (output) {
  return output.replace(/"webpackOutput": "[^"]+"/, '"webpackOutput": "/tmp/"')
}

async function check (cwd, args) {
  let [process, history] = createProcess(cwd, args)
  await run(process)
  expect(history.stderr).toEqual('')
  expect(history.exitCode).toEqual(0)
  return history.stdout
}

async function error (cwd, args) {
  let [process, history] = createProcess(cwd, args)
  await run(process)
  expect(history.stdout).toEqual('')
  expect(history.exitCode).toEqual(1)
  return history.stderr
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
  expect(stderr).toContain('JSONError')
})

it('shows error in JSON format', async () => {
  let [process, history] = createProcess('/', ['--json'])
  await run(process)
  expect(history.exitCode).toEqual(1)
  expect(history.stderr).toEqual('')
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

it('shows migration guide for yarn 2 users', async () => {
  let [process, history] = createProcess('yarn-without-dev-dep')
  await run(process)
  expect(history.exitCode).toEqual(0)
  expect(history.stderr).toMatchSnapshot()
})

it('shows migration guide for npm users, because of yarn 2', async () => {
  let [process, history] = createProcess('npm-without-dev-dep')
  await run(process)
  expect(history.exitCode).toEqual(0)
  expect(history.stderr).toMatchSnapshot()
})

it('shows size-limit dependency warning', async () => {
  let [process, history] = createProcess('warn')
  await run(process)
  expect(history.exitCode).toEqual(0)
  expect(history.stderr).toMatchSnapshot()
})

it('throws on unknown argument', async () => {
  expect(await error('file', ['--unknown'])).toMatchSnapshot()
})

it('throws on --save-bundle argument without webpack', async () => {
  expect(await error('file', ['--save-bundle'])).toMatchSnapshot()
})

it('throws on --why argument without webpack', async () => {
  expect(await error('file', ['--why'])).toMatchSnapshot()
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

it('works in integration test with JSON', async () => {
  expect(await check('integration', ['--json'])).toMatchSnapshot()
})

it('works in integration test with size', async () => {
  expect(await check('integration')).toMatchSnapshot()
})

it('works in integration test with time', async () => {
  expect(await check('integration', ['--limit', '2s'])).toMatchSnapshot()
})

it('shows error on time bigger than limit', async () => {
  let [process, history] = createProcess('integration', ['--limit', '1 s'])
  await run(process)
  expect(history.exitCode).toEqual(1)
  expect(history.stderr).toEqual('')
  expect(history.stdout).toMatchSnapshot()
})

it('returns zero bytes for empty file', async () => {
  expect(await check('zero')).toMatchSnapshot()
})

it('returns zero bytes for empty file without gzip', async () => {
  expect(await check('zero-non-gzip')).toMatchSnapshot()
})

it('shows debug', async () => {
  expect(normalize(await check('integration', ['--debug']))).toMatchSnapshot()
})

it('shows debug on error', async () => {
  expect(await error('internal-error', ['--debug'])).toMatchSnapshot()
})
