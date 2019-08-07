let sizeLimitWebpack = require('@size-limit/webpack')
let sizeLimitFile = require('@size-limit/file')
let { join } = require('path')

let calc = require('../calc')
let run = require('../run')

jest.mock('../calc')

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
        history.stdout += str.split(ROOT).join('')
      }
    },
    stderr: {
      write (str) {
        history.stderr += str.split(ROOT).join('')
      }
    }
  }
  return [process, history]
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
  expect(output.error).toContain('SizeLimitError: Size Limit did’t find')
})

it('shows migration guide for npm users', async () => {
  expect(await error('legacy-npm')).toMatchSnapshot()
})

it('shows migration guide for yarn users', async () => {
  expect(await error('legacy-yarn')).toMatchSnapshot()
})

it('throws on unknown argument', async () => {
  expect(await error('file', ['--unknown'])).toMatchSnapshot()
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

it('throws on webpack option without webpack module', async () => {
  expect(await error('non-webpack')).toMatchSnapshot()
  expect(await error('non-webpack-ignore')).toMatchSnapshot()
  expect(await error('non-webpack-config')).toMatchSnapshot()
})

it('throws on gzip option without gzip module', async () => {
  expect(await error('non-gzip')).toMatchSnapshot()
})

it('throws on running option without time module', async () => {
  expect(await error('non-time')).toMatchSnapshot()
})

it('creates config by CLI arguments', async () => {
  calc.mockImplementation(() => [])
  await check('file', ['--limit', '1 s', 'a.js', '/b.js'])
  expect(calc).toHaveBeenCalledWith(sizeLimitFile, {
    checks: [
      {
        name: 'a.js, /b.js',
        limit: '1 s',
        path: [fixture('file', 'a.js'), '/b.js']
      }
    ]
  })
})

it('supports globby and main field', async () => {
  calc.mockImplementation(() => [])
  await check('globby')
  expect(calc).toHaveBeenCalledWith(sizeLimitFile, {
    checks: [
      {
        name: 'a',
        limit: '1 KB',
        path: [fixture('globby', 'a1.js'), fixture('globby', 'a2.js')]
      },
      {
        name: 'b',
        path: [fixture('globby', 'b1.js')]
      }
    ]
  })
})

it('uses index.js by default', async () => {
  calc.mockImplementation(() => [])
  await check('simple')
  expect(calc).toHaveBeenCalledWith(sizeLimitFile, {
    checks: [
      {
        name: 'index',
        path: [fixture('simple', 'index.js')],
        limit: '1 KB'
      }
    ]
  })
})

it('overrides limit by CLI arg', async () => {
  calc.mockImplementation(() => [])
  await check('simple', ['--limit', '10 KB'])
  expect(calc).toHaveBeenCalledWith(sizeLimitFile, {
    checks: [
      {
        name: 'index',
        path: [fixture('simple', 'index.js')],
        limit: '10 KB'
      }
    ]
  })
})

it('normalizes bundle and webpack arguments', async () => {
  calc.mockImplementation(() => [])
  await check('webpack', ['--why', '--save-build', 'out'])
  expect(calc).toHaveBeenCalledWith(sizeLimitWebpack, {
    why: true,
    project: 'webpack',
    saveBuild: fixture('webpack', 'out'),
    checks: [
      {
        name: 'index.js',
        path: [fixture('webpack', 'index.js')]
      }
    ]
  })
})

it('uses peerDependencies as ignore option', async () => {
  calc.mockImplementation(() => [])
  await check('peer')
  expect(calc).toHaveBeenCalledWith(sizeLimitWebpack, {
    checks: [
      {
        name: 'index.js',
        ignore: ['a', 'b'],
        path: [fixture('peer', 'index.js')]
      }
    ]
  })
})
