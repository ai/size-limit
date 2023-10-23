import { join } from 'node:path'
import { beforeEach, expect, it, vi } from 'vitest'

import calc from '../calc'
import run from '../run'

vi.mock('../create-reporter', () => {
  return {
    default: () => ({
      error(e) {
        throw e
      },
      results() {}
    })
  }
})
vi.mock('../calc')

function fixture(...files) {
  return join(__dirname, '..', '..', '..', 'fixtures', ...files)
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
    checks: [
      {
        files: [fixture('file', 'a.js'), '/b.js'],
        limit: '10',
        name: 'a.js, /b.js',
        sizeLimit: 10
      }
    ],
    cwd: fixture('file')
  })
})

it('supports globby and main field', async () => {
  expect(await check('globby')).toEqual({
    checks: [
      {
        files: [fixture('globby', 'a1.js'), fixture('globby', 'a2.js')],
        limit: '1 kB',
        name: 'a',
        path: ['a*.js'],
        sizeLimit: 1000
      },
      {
        files: [fixture('globby', 'b1.js')],
        name: 'b'
      }
    ],
    configPath: 'package.json',
    cwd: fixture('globby')
  })
})

it('uses index.js by default', async () => {
  expect(await check('simple')).toEqual({
    checks: [
      {
        files: [fixture('simple', 'index.js')],
        limit: '1 kB',
        name: 'index',
        sizeLimit: 1000
      }
    ],
    configPath: 'package.json',
    cwd: fixture('simple')
  })
})

it('overrides limit by CLI arg', async () => {
  expect(await check('simple', ['--limit', '10 kB'])).toEqual({
    checks: [
      {
        files: [fixture('simple', 'index.js')],
        limit: '10 kB',
        name: 'index',
        sizeLimit: 10000
      }
    ],
    configPath: 'package.json',
    cwd: fixture('simple')
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
    checks: [
      {
        config: fixture('webpack', 'webpack.config.js'),
        entry: ['a'],
        highlightLess: true,
        name: 'a'
      }
    ],
    cleanDir: true,
    configPath: 'package.json',
    cwd: fixture('webpack'),
    hidePassed: true,
    highlightLess: true,
    project: 'webpack',
    saveBundle: fixture('webpack', 'out'),
    why: true
  })
})

it('normalizes bundle and webpack arguments with --why and compare-with', async () => {
  let args = [
    '--why',
    '--save-bundle',
    'out',
    '--compare-with',
    'before.json',
    '--clean-dir',
    '--hide-passed',
    '--highlight-less'
  ]
  expect(await check('webpack', args)).toEqual({
    checks: [
      {
        config: fixture('webpack', 'webpack.config.js'),
        entry: ['a'],
        highlightLess: true,
        name: 'a'
      }
    ],
    cleanDir: true,
    compareWith: fixture('webpack', 'before.json'),
    configPath: 'package.json',
    cwd: fixture('webpack'),
    hidePassed: true,
    highlightLess: true,
    project: 'webpack',
    saveBundle: fixture('webpack', 'out'),
    why: true
  })
})

it('normalizes bundle and webpack arguments with --why and ui-reports', async () => {
  let args = [
    '--why',
    '--save-bundle',
    'out',
    '--clean-dir',
    '--hide-passed',
    '--highlight-less'
  ]
  expect(await check('ui-reports', args)).toEqual({
    checks: [
      {
        config: fixture('ui-reports', 'webpack.config.js'),
        entry: ['a'],
        highlightLess: true,
        name: 'a',
        uiReports: require(fixture('ui-reports', 'reports.js'))
      }
    ],
    cleanDir: true,
    configPath: '.size-limit.js',
    cwd: fixture('ui-reports'),
    hidePassed: true,
    highlightLess: true,
    project: 'ui-reports',
    saveBundle: fixture('ui-reports', 'out'),
    why: true
  })
})

it('uses peerDependencies as ignore option', async () => {
  expect(await check('peer')).toEqual({
    checks: [
      {
        files: [fixture('peer', 'index.js')],
        ignore: ['a', 'b'],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.json',
    cwd: fixture('peer')
  })
})

it('normalizes time limits', async () => {
  expect(await check('time')).toEqual({
    checks: [
      {
        files: [fixture('time', 'index.js')],
        limit: '1 s',
        name: 'index.js',
        path: 'index.js',
        timeLimit: 1
      },
      {
        files: [fixture('time', 'index.js')],
        limit: '1 ms',
        name: 'index.js',
        path: 'index.js',
        running: false,
        timeLimit: 0.001
      },
      {
        files: [fixture('time', 'index.js')],
        limit: '10ms',
        name: 'index.js',
        path: 'index.js',
        timeLimit: 0.01
      },
      {
        files: [fixture('time', 'index.js')],
        limit: '10s',
        name: 'index.js',
        path: 'index.js',
        timeLimit: 10
      }
    ],
    configPath: 'package.json',
    cwd: fixture('time')
  })
})

it('normalizes import', async () => {
  expect(await check('integration-esm')).toEqual({
    checks: [
      {
        files: [fixture('integration-esm', 'index.js')],
        highlightLess: true,
        import: {
          [fixture('integration-esm', 'index.js')]:
            '{ VERY_LONG_NAME_FOR_CONST_TO_TEST_TREE_SHAKING }'
        },
        limit: '1 B',
        name: 'index.js',
        sizeLimit: 1
      },
      {
        files: [fixture('integration-esm', 'index.js')],
        highlightLess: true,
        limit: '39 B',
        name: 'all',
        sizeLimit: 39
      }
    ],
    configPath: 'package.json',
    cwd: fixture('integration-esm')
  })
})
