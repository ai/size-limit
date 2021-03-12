let { join } = require('path')

let calc = require('../calc')
let run = require('../run')

jest.mock('../create-reporter', () => () => ({
  results() {},
  error(e) {
    throw e
  }
}))
jest.mock('../calc')

function fixture(...files) {
  return join(__dirname, 'fixtures', ...files)
}

async function check(cwd, args = []) {
  let process = {
    argv: ['node', 'size-limit', ...args],
    cwd() {
      return fixture(cwd)
    },
    exit(code) {
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
    cwd: fixture('file'),
    checks: [
      {
        name: 'a.js, /b.js',
        limit: '10',
        sizeLimit: 10,
        files: [fixture('file', 'a.js'), '/b.js']
      }
    ]
  })
})

it('supports globby and main field', async () => {
  expect(await check('globby')).toEqual({
    configPath: 'package.json',
    cwd: fixture('globby'),
    checks: [
      {
        path: ['a*.js'],
        name: 'a',
        limit: '1 KB',
        sizeLimit: 1024,
        files: [fixture('globby', 'a1.js'), fixture('globby', 'a2.js')]
      },
      {
        name: 'b',
        files: [fixture('globby', 'b1.js')]
      }
    ]
  })
})

it('uses index.js by default', async () => {
  expect(await check('simple')).toEqual({
    configPath: 'package.json',
    cwd: fixture('simple'),
    checks: [
      {
        name: 'index',
        files: [fixture('simple', 'index.js')],
        limit: '1 KB',
        sizeLimit: 1024
      }
    ]
  })
})

it('overrides limit by CLI arg', async () => {
  expect(await check('simple', ['--limit', '10 KB'])).toEqual({
    configPath: 'package.json',
    cwd: fixture('simple'),
    checks: [
      {
        name: 'index',
        files: [fixture('simple', 'index.js')],
        limit: '10 KB',
        sizeLimit: 10240
      }
    ]
  })
})

it('normalizes bundle and webpack arguments', async () => {
  let args = [
    '--why',
    '--save-bundle',
    'out',
    '--clean-dir',
    '--hide-passed',
    '--highlight-less'
  ]
  expect(await check('webpack', args)).toEqual({
    configPath: 'package.json',
    cwd: fixture('webpack'),
    why: true,
    project: 'webpack',
    hidePassed: true,
    highlightLess: true,
    saveBundle: fixture('webpack', 'out'),
    cleanDir: true,
    checks: [
      {
        name: 'a',
        highlightLess: true,
        config: fixture('webpack', 'webpack.config.js'),
        entry: ['a']
      }
    ]
  })
})

it('uses peerDependencies as ignore option', async () => {
  expect(await check('peer')).toEqual({
    configPath: '.size-limit.json',
    cwd: fixture('peer'),
    checks: [
      {
        name: 'index.js',
        ignore: ['a', 'b'],
        files: [fixture('peer', 'index.js')],
        path: 'index.js'
      }
    ]
  })
})

it('normalizes time limits', async () => {
  expect(await check('time')).toEqual({
    configPath: 'package.json',
    cwd: fixture('time'),
    checks: [
      {
        path: 'index.js',
        limit: '1 s',
        timeLimit: 1,
        name: 'index.js',
        files: [fixture('time', 'index.js')]
      },
      {
        path: 'index.js',
        limit: '1 ms',
        timeLimit: 0.001,
        name: 'index.js',
        files: [fixture('time', 'index.js')],
        running: false
      },
      {
        path: 'index.js',
        limit: '10ms',
        timeLimit: 0.01,
        name: 'index.js',
        files: [fixture('time', 'index.js')]
      },
      {
        path: 'index.js',
        limit: '10s',
        timeLimit: 10,
        name: 'index.js',
        files: [fixture('time', 'index.js')]
      }
    ]
  })
})

it('normalizes import', async () => {
  expect(await check('integration-esm')).toEqual({
    cwd: fixture('integration-esm'),
    configPath: 'package.json',
    checks: [
      {
        import: {
          [fixture(
            'integration-esm',
            'index.js'
          )]: '{ VERY_LONG_NAME_FOR_CONST_TO_TEST_TREE_SHAKING }'
        },
        limit: '1 B',
        highlightLess: true,
        name: 'index.js',
        files: [fixture('integration-esm', 'index.js')],
        sizeLimit: 1
      }
    ]
  })
})
