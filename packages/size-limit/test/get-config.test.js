import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

it('supports tinyglobby and main field', async () => {
  expect(await check('tinyglobby')).toEqual({
    checks: [
      {
        files: [fixture('tinyglobby', 'a1.js'), fixture('tinyglobby', 'a2.js')],
        limit: '1 kB',
        name: 'a',
        path: ['a*.js'],
        sizeLimit: 1000
      },
      {
        files: [fixture('tinyglobby', 'b1.js')],
        name: 'b'
      }
    ],
    configPath: 'package.json',
    cwd: fixture('tinyglobby')
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

it('works with .mjs config file', async () => {
  expect(await check('mjs-config-file')).toEqual({
    checks: [
      {
        files: [fixture('mjs-config-file', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.mjs',
    cwd: fixture('mjs-config-file')
  })
})

it('works with .js config file', async () => {
  expect(await check('js-config-file')).toEqual({
    checks: [
      {
        files: [fixture('js-config-file', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.js',
    cwd: fixture('js-config-file')
  })
})

it('works with .js config file and "type": "module"', async () => {
  expect(await check('js-config-file-with-type-module')).toEqual({
    checks: [
      {
        files: [fixture('js-config-file-with-type-module', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.js',
    cwd: fixture('js-config-file-with-type-module')
  })
})

it('works with .js config file and `export default` without "type": "module"', async () => {
  expect(await check('js-config-file-esm')).toEqual({
    checks: [
      {
        files: [fixture('js-config-file-esm', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.js',
    cwd: fixture('js-config-file-esm')
  })
})

it('works with .cjs config file and `export default` without "type": "module"', async () => {
  expect(await check('cjs-config-file-esm')).toEqual({
    checks: [
      {
        files: [fixture('cjs-config-file-esm', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.cjs',
    cwd: fixture('cjs-config-file-esm')
  })
})

it('works with .cjs config file and `module.exports` without "type": "module"', async () => {
  expect(await check('cjs-config-file-cjs')).toEqual({
    checks: [
      {
        files: [fixture('cjs-config-file-cjs', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.cjs',
    cwd: fixture('cjs-config-file-cjs')
  })
})

it('works with .ts config file and `export default` without "type": "module"', async () => {
  expect(await check('ts-config-file-esm')).toEqual({
    checks: [
      {
        files: [fixture('ts-config-file-esm', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.ts',
    cwd: fixture('ts-config-file-esm')
  })
})

it('works with .ts config file', async () => {
  expect(await check('ts-config-file')).toEqual({
    checks: [
      {
        files: [fixture('ts-config-file', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.ts',
    cwd: fixture('ts-config-file')
  })
})

it('works with .cts config file', async () => {
  expect(await check('cts-config-file')).toEqual({
    checks: [
      {
        files: [fixture('cts-config-file', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.cts',
    cwd: fixture('cts-config-file')
  })
})

it('works with .mts config file', async () => {
  expect(await check('mts-config-file')).toEqual({
    checks: [
      {
        files: [fixture('mts-config-file', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.mts',
    cwd: fixture('mts-config-file')
  })
})

it('works with .ts config file and "type": "module"', async () => {
  expect(await check('ts-config-file-with-type-module')).toEqual({
    checks: [
      {
        files: [fixture('ts-config-file-with-type-module', 'index.js')],
        name: 'index.js',
        path: 'index.js'
      }
    ],
    configPath: '.size-limit.ts',
    cwd: fixture('ts-config-file-with-type-module')
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
        limit: '48 B',
        name: 'all',
        sizeLimit: 48
      }
    ],
    configPath: 'package.json',
    cwd: fixture('integration-esm')
  })
})

it('normalizes networkSpeed option for time plugin', async () => {
  let cwd = 'time-network-speed'
  expect(await check(cwd)).toEqual({
    checks: [
      {
        files: [fixture(cwd, 'index.js')],
        name: 'index.js',
        path: 'index.js',
        time: { networkSpeed: 20 }
      },
      {
        files: [fixture(cwd, 'index.js')],
        name: 'index.js',
        time: { networkSpeed: 20000 }
      }
    ],
    configPath: 'package.json',
    cwd: fixture(cwd)
  })
})

it('normalizes latency option for time plugin', async () => {
  let cwd = 'time-latency'
  expect(await check(cwd)).toEqual({
    checks: [
      {
        files: [fixture(cwd, 'index.js')],
        name: 'index.js',
        path: 'index.js',
        time: { latency: 0.2 }
      },
      {
        files: [fixture(cwd, 'index.js')],
        name: 'index.js',
        time: { latency: 2.35 }
      }
    ],
    configPath: 'package.json',
    cwd: fixture(cwd)
  })
})

const allConfigFileExtensions = ['mjs', 'js', 'cjs', 'ts', 'mts', 'cts']
const exportTypes = [
  { exportSyntax: 'export default', moduleType: 'esm' },
  { exportSyntax: 'module.exports', moduleType: 'cjs' }
]

describe.each(allConfigFileExtensions)(
  'config file with `.%s` extension',
  extension => {
    it.each(exportTypes)(
      'works with $moduleType module syntax ($exportSyntax)',
      async ({ moduleType }) => {
        expect(await check(`${extension}-config-file-${moduleType}`)).toEqual({
          checks: [
            {
              files: [
                fixture(`${extension}-config-file-${moduleType}`, 'index.js')
              ],
              name: 'index.js',
              path: 'index.js'
            }
          ],
          configPath: `.size-limit.${extension}`,
          cwd: fixture(`${extension}-config-file-${moduleType}`)
        })
      }
    )
  }
)
