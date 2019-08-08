let { join } = require('path')

let calc = require('../calc')
let run = require('../run')

jest.mock('../create-reporter', () => () => ({
  results () { },
  error (e) {
    throw e
  }
}))
jest.mock('../calc')

function fixture (...files) {
  return join(__dirname, 'fixtures', ...files)
}

async function check (cwd, args = []) {
  let process = {
    argv: ['node', 'size-limit', ...args],
    cwd () {
      return fixture(cwd)
    },
    exit (code) {
      if (code !== 0) {
        throw new Error('Exit code ', code)
      }
    }
  }
  await run(process)
  return calc.mock.calls[0][1]
}

beforeEach(() => {
  calc.mockReset()
})

it('creates config by CLI arguments', async () => {
  expect(await check('file', ['--limit', '10', 'a.js', '/b.js'])).toEqual({
    checks: [
      {
        name: 'a.js, /b.js',
        limit: '10',
        sizeLimit: 10,
        path: [fixture('file', 'a.js'), '/b.js']
      }
    ]
  })
})

it('supports globby and main field', async () => {
  expect(await check('globby')).toEqual({
    configPath: 'package.json',
    checks: [
      {
        name: 'a',
        limit: '1 KB',
        sizeLimit: 1024,
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
  expect(await check('simple')).toEqual({
    configPath: 'package.json',
    checks: [
      {
        name: 'index',
        path: [fixture('simple', 'index.js')],
        limit: '1 KB',
        sizeLimit: 1024
      }
    ]
  })
})

it('overrides limit by CLI arg', async () => {
  expect(await check('simple', ['--limit', '10 KB'])).toEqual({
    configPath: 'package.json',
    checks: [
      {
        name: 'index',
        path: [fixture('simple', 'index.js')],
        limit: '10 KB',
        sizeLimit: 10240
      }
    ]
  })
})

it('normalizes bundle and webpack arguments', async () => {
  expect(await check('webpack', ['--why', '--save-bundle', 'out'])).toEqual({
    configPath: 'package.json',
    why: true,
    project: 'webpack',
    saveBundle: fixture('webpack', 'out'),
    checks: [
      {
        name: 'index.js',
        path: [fixture('webpack', 'index.js')]
      }
    ]
  })
})

it('uses peerDependencies as ignore option', async () => {
  expect(await check('peer')).toEqual({
    configPath: '.size-limit.json',
    checks: [
      {
        name: 'index.js',
        ignore: ['a', 'b'],
        path: [fixture('peer', 'index.js')]
      }
    ]
  })
})

it('normalizes time limits', async () => {
  expect(await check('time')).toEqual({
    configPath: 'package.json',
    checks: [
      {
        limit: '1 s',
        timeLimit: 1,
        name: 'index.js',
        path: [fixture('time', 'index.js')]
      },
      {
        limit: '1 ms',
        timeLimit: 0.001,
        name: 'index.js',
        path: [fixture('time', 'index.js')],
        running: false
      },
      {
        limit: '10ms',
        timeLimit: 0.01,
        name: 'index.js',
        path: [fixture('time', 'index.js')]
      },
      {
        limit: '10s',
        timeLimit: 10,
        name: 'index.js',
        path: [fixture('time', 'index.js')]
      }
    ]
  })
})
