let { join } = require('path')

let run = require('../run')

const ROOT = join(__dirname, '..', '..', '..')

function createProcess (fixture, args = []) {
  let history = {
    exitCode: 0,
    stdout: '',
    stderr: ''
  }
  let process = {
    argv: ['node', 'size-limit', ...args],
    cwd () {
      if (fixture.includes('/')) {
        return fixture
      } else {
        return join(__dirname, 'fixtures', fixture)
      }
    },
    exit (code) {
      history.exitCode = code
    },
    stdout: {
      write (str) {
        history.stdout += str.replace(ROOT, '')
      }
    },
    stderr: {
      write (str) {
        history.stderr += str.replace(ROOT, '')
      }
    }
  }
  return [process, history]
}

async function check (fixture, args) {
  let [process, history] = createProcess(fixture, args)
  await run(process)
  expect(history.stderr).toEqual('')
  expect(history.exitCode).toEqual(0)
  return history.stdout
}

async function error (fixture, args) {
  let [process, history] = createProcess(fixture, args)
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
  let out = await check('file', ['--help'])
  expect(out).toContain('Core options:')
  expect(out).not.toContain('Webpack options:')
})

it('shows webpack-related help', async () => {
  let out = await check('webpack', ['--help'])
  expect(out).toContain('Core options:')
  expect(out).toContain('Webpack options:')
})

it('uses dependencies to detect modules', async () => {
  let out = await check('dependencies', ['--help'])
  expect(out).toContain('Webpack options:')
})

it('shows error on missed package.json', async () => {
  let stderr = await error('/')
  expect(stderr).toMatchSnapshot()
})

it('shows syntax errors in package.json', async () => {
  let stderr = await error('package-syntax')
  expect(stderr).toMatchSnapshot()
})

it('shows own error in JSON format', async () => {
  let [process, history] = createProcess('/', ['--json'])
  await run(process)
  expect(history.exitCode).toEqual(1)
  expect(history.stderr).toEqual('')
  expect(history.stdout).toMatchSnapshot()
})

it('shows external error in JSON format', async () => {
  let [process, history] = createProcess('package-syntax', ['--json'])
  await run(process)
  expect(history.exitCode).toEqual(1)
  expect(history.stderr).toEqual('')
  expect(history.stdout).toMatchSnapshot()
})
