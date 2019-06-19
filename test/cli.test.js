let { existsSync } = require('fs')
let { tmpdir } = require('os')
let { join } = require('path')
let spawn = require('cross-spawn')
let del = require('del')

const ABSOLUTE_OUTPUT = join(tmpdir(), 'size-limit-bundle')
const RELATIVE_OUTPUT = join(__dirname, 'output-test')

function fixture (file) {
  return join(__dirname, 'fixtures', file)
}

function run (args, options, env) {
  if (!options) options = { }
  options.env = {
    TRAVIS_JOB_NUMBER: '1.1',
    APPVEYOR_JOB_NUMBER: '1',
    FORCE_COLOR: '0'
  }
  for (let i in process.env) {
    if (!options.env[i]) options.env[i] = process.env[i]
  }
  for (let i in env) {
    options.env[i] = env[i]
  }
  let cli = spawn(join(__dirname, '../cli.js'), args, options)
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

function packageError (msg) {
  return ' ERROR  ' + msg + '\n' +
         '        Fix it according to Size Limit docs.\n' +
         '\n' +
         '  "size-limit": ['
}

function configError (msg) {
  return ' ERROR  ' + msg + '\n' +
         '        Fix it according to Size Limit docs.\n' +
         '\n' +
         '  [\n'
}

process.env.FAKE_SIZE_LIMIT_RUNNING = 1

afterEach(() => Promise.all([
  del(join(__dirname, 'fixtures/webpack-multipe-entry-points/dist')),
  del(join(__dirname, 'fixtures/webpack-config/dist')),
  del(join(__dirname, '../dist')),
  del(ABSOLUTE_OUTPUT, { force: true }),
  del(RELATIVE_OUTPUT)
]))

it('returns help', async () => {
  let { out, code } = await run(['--help'])
  expect(out).toContain('Options:')
  expect(code).toEqual(0)
})

it('returns version', async () => {
  let { out, code } = await run(['--version'])
  expect(out).toMatch(/\d+\.\d+\.\d+/)
  expect(code).toEqual(0)
})

it('shows resolve errors', async () => {
  let { out, code } = await run([], { cwd: fixture('unknown') })
  expect(out).toContain('unknown.js')
  expect(out).toMatch(/Size Limit can't resolve/)
  expect(code).toEqual(1)
})

it('shows size-limit section error', async () => {
  let { out, code } = await run([], { cwd: fixture('missed') })
  expect(out).toContain(
    ' ERROR  Can not find settings for Size Limit.\n' +
    '        Add it to section "size-limit" in package.json ' +
    'according to Size Limit docs.\n' +
    '\n' +
    '  "size-limit": ['
  )
  expect(code).toEqual(1)
})

it('shows size-limit type error', async () => {
  let { out, code } = await run([], { cwd: fixture('type') })
  expect(out).toContain(packageError(
    'The "size-limit" section of package.json must be an array.'
  ))
  expect(code).toEqual(1)
})

it('shows size-limit section content error with wrong path', async () => {
  let { out, code } = await run([], { cwd: fixture('wrong-package-path') })
  expect(out).toContain(packageError(
    'The path in the "size-limit" section of package.json must be ' +
    'a string or an array of strings.'
  ))
  expect(code).toEqual(1)
})

it('shows size-limit section content error with wrong entry', async () => {
  let { out, code } = await run([], { cwd: fixture('wrong-package-entry') })
  expect(out).toContain(packageError(
    'The entry in the "size-limit" section of package.json must be ' +
    'a string or an array of strings.'
  ))
  expect(code).toEqual(1)
})

it('shows empty content error', async () => {
  let { out, code } = await run([], { cwd: fixture('empty-config') })
  expect(out).toContain(configError(
    'Size Limit config must not be empty.'
  ))
  expect(code).toEqual(1)
})

it('shows not string error with wrong entry', async () => {
  let { out, code } = await run([], { cwd: fixture('wrong-config-entry') })
  expect(out).toContain(configError(
    'The entry in Size Limit config must be a string or an array of strings.'
  ))
  expect(code).toEqual(1)
})

it('shows not string error with wrong path', async () => {
  let { out, code } = await run([], { cwd: fixture('wrong-config-path') })
  expect(out).toContain(configError(
    'The path in Size Limit config must be a string or an array of strings.'
  ))
  expect(code).toEqual(1)
})

it('uses .size-limit.json file config', async () => {
  let { out, code } = await run([], { cwd: fixture('config') })
  expect(out).toContain('Size limit:   1 KB')
  expect(code).toEqual(0)
})

it('uses .size-limit.js file config', async () => {
  let { out, code } = await run([], { cwd: fixture('js') })
  expect(out).toContain('Size limit:   1 KB')
  expect(code).toEqual(0)
})

it('overrides config by limit argument', async () => {
  let { out, code } = await run(['--limit', '1B'], { cwd: fixture('config') })
  expect(out).toContain('Size limit:   1 B\n')
  expect(code).toEqual(3)
})

it('runs only on first job in Travis CI', async () => {
  let { out, code } = await run([], { }, {
    TRAVIS: '1', TRAVIS_JOB_NUMBER: '1.2'
  })
  expect(out).toContain('first CI job')
  expect(code).toEqual(0)
})

it('shows size without limit', async () => {
  let { out, code } = await run([], { cwd: fixture('unlimit') })
  expect(out).toEqual(
    '\n' +
    '  Package size: 0 B  with all dependencies, minified and gzipped\n' +
    '  Loading time: 0 ms on slow 3G\n' +
    '  Running time: 1 s  on Snapdragon 410\n' +
    '  Total time:   1 s\n' +
    '\n'
  )
  expect(code).toEqual(0)
})

it('shows limit', async () => {
  let { out, code } = await run([], { cwd: fixture('good') })
  expect(out).toEqual(
    '\n' +
    '  index.js\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B  with all dependencies, minified and gzipped\n' +
    '  Loading time: 10 ms on slow 3G\n' +
    '  Running time: 1 s   on Snapdragon 410\n' +
    '  Total time:   1.1 s\n' +
    '\n' +
    '  index2.js\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B  with all dependencies, minified and gzipped\n' +
    '  Loading time: 10 ms on slow 3G\n' +
    '  Running time: 1 s   on Snapdragon 410\n' +
    '  Total time:   1.1 s\n' +
    '\n' +
    '  index3.js\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B  with all dependencies, minified and gzipped\n' +
    '  Loading time: 10 ms on slow 3G\n' +
    '  Running time: 1 s   on Snapdragon 410\n' +
    '  Total time:   1.1 s\n' +
    '\n'
  )
  expect(code).toEqual(0)
})

it('accepts array for path', async () => {
  let { out, code } = await run([], { cwd: fixture('array') })
  expect(out).toContain('index1.js\n  Package size: 14 B')
  expect(out).toContain('index1.js, index2.js\n  Package size: 23 B')
  expect(code).toEqual(0)
})

it('supports glob patterns', async () => {
  let { out, code } = await run([], { cwd: fixture('glob') })
  expect(out).toContain('Package size: 10 B')
  expect(code).toEqual(0)
})

it('supports ES2016', async () => {
  let { out, code } = await run([], { cwd: fixture('es2016') })
  expect(out).toContain('Package size: 25 B')
  expect(code).toEqual(0)
})

it('supports multiple files', async () => {
  let { out, code } = await run([], { cwd: fixture('multiple') })
  expect(out).toContain('Package size: 16 B')
  expect(code).toEqual(0)
})

it('checks limits', async () => {
  let { out, code } = await run([], { cwd: fixture('bad') })
  expect(out).toEqual(
    '\n' +
    '  Package size limit has exceeded by 95 B\n' +
    '  Size limit:   30 KB\n' +
    '  Package size: 30.09 KB with all dependencies, minified and gzipped\n' +
    '  Loading time: 602 ms   on slow 3G\n' +
    '  Running time: 1 s      on Snapdragon 410\n' +
    '  Total time:   1.7 s\n' +
    '\n' +
    '  Try to reduce size or increase limit in "size-limit" section ' +
      'of package.json\n'
  )
  expect(code).toEqual(3)
})

it('checks time limits', async () => {
  let { out, code } = await run([], { cwd: fixture('time') })
  expect(out).toEqual(
    '\n' +
    '  Total time limit has exceeded\n' +
    '  Time limit:   500 ms\n' +
    '  Package size: 10 B   with all dependencies, minified and gzipped\n' +
    '  Loading time: 10 ms  on slow 3G\n' +
    '  Running time: 1 s    on Snapdragon 410\n' +
    '  Total time:   1.1 s\n' +
    '\n' +
    '  Try to reduce size or increase limit in .size-limit.json\n'
  )
  expect(code).toEqual(3)
})

it('takes time limit from argument', async () => {
  let file = 'test/fixtures/unlimit/empty.js'
  let { out, code } = await run(['--limit', '1 s', file])
  expect(out).toContain('Time limit:   1 s')
  expect(code).toEqual(0)
})

it('allows to avoid space in time', async () => {
  let { out, code } = await run(['--limit', '1s'], { cwd: fixture('unlimit') })
  expect(out).toContain('Time limit:   1 s')
  expect(code).toEqual(0)
})

it('uses names', async () => {
  let { out, code } = await run([], { cwd: fixture('named') })
  expect(out).toContain('  First\n  Size limit:   1 KB')
  expect(out).toContain('  Second\n  Size limit:   1 KB')
  expect(code).toEqual(0)
})

it('shows analyzer', async () => {
  let { out, code } = await run(['--why'], { cwd: fixture('unlimit') })
  expect(out).toContain('Webpack Bundle Analyzer')
  expect(code).toEqual(0)
})

it('shows analyzer for multiple limits', async () => {
  let { out, code } = await run(['--why'], { cwd: fixture('good') })
  expect(out.match(/Webpack Bundle Analyzer/g)).toHaveLength(1)
  expect(code).toEqual(0)
})

it('uses limit in non-config mode', async () => {
  let file = 'test/fixtures/unlimit/empty.js'
  let { out, code } = await run(['--limit', '10 KB', file])
  expect(out).toContain('Size limit:   10 KB\n')
  expect(code).toEqual(0)
})

it('supports absolute path', async () => {
  let file = join(__dirname, 'fixtures/unlimit/empty.js')
  let { out, code } = await run([file])
  expect(out).toContain('Package size: 0 B')
  expect(code).toEqual(0)
})

it('ignores peerDependencies', async () => {
  let { out, code } = await run([], { cwd: fixture('peer') })
  expect(out).toContain('Package size: 105 B')
  expect(code).toEqual(0)
})

it('supports ignore option', async () => {
  let { out, code } = await run([], { cwd: fixture('ignore') })
  expect(out).toContain('Package size: 9 B')
  expect(code).toEqual(0)
})

it('disables webpack by option', async () => {
  let { out, code } = await run([], { cwd: fixture('bundled') })
  expect(out).toContain('Package size: 37 B  minified and gzipped\n')
  expect(code).toEqual(0)
})

it('disables gzip by option', async () => {
  let { out, code } = await run([], { cwd: fixture('gzip') })
  expect(out).toContain(
    'Package size: 14 B  with all dependencies and minified\n'
  )
  expect(code).toEqual(0)
})

it('disables running by option', async () => {
  let { out, code } = await run([], { cwd: fixture('running') })
  expect(out).not.toContain('Running time')
  expect(out).not.toContain('Total time')
  expect(code).toEqual(0)
})

it('disables webpack, gzip and running by argument', async () => {
  let { out, code } = await run([
    '--no-webpack',
    '--no-gzip',
    '--no-running-time',
    'test/fixtures/bad/index.js'
  ])
  expect(out).toContain('Package size: 55 B  minified\n')
  expect(out).not.toContain('Running time')
  expect(code).toEqual(0)
})

it('throws on --why with disabled webpack', async () => {
  let { out, code } = await run(['--why'], { cwd: fixture('bundled') })
  expect(out).toContain('--why does not work')
  expect(code).toEqual(1)
})

it('uses custom webpack', async () => {
  let { out, code } = await run([], { cwd: fixture('webpack-config') })
  expect(out).toContain(
    'Package size: 2.84 KB with given webpack configuration'
  )
  expect(code).toEqual(0)
})

it('uses custom webpack when specified via --config', async () => {
  let { out, code } = await run([
    '--config', fixture('webpack-config/webpack.config.js'),
    fixture('webpack-config/index.js')
  ])
  expect(out).toContain(
    'Package size: 3.01 KB with given webpack configuration'
  )
  expect(code).toEqual(0)
})

it('uses entry to support webpack multiple entry points', async () => {
  let { out, code } = await run([], {
    cwd: fixture('webpack-multipe-entry-points')
  })
  expect(out).toContain(
    'Package size: 12.67 KB with given webpack configuration'
  )
  expect(code).toEqual(0)
})

it('uses main from package.json', async () => {
  let { out, code } = await run([], { cwd: fixture('main') })
  expect(out).toContain('Package size: 10 B')
  expect(code).toEqual(0)
})

it('uses main from package.json which as no file extension', async () => {
  let { out, code } = await run([], { cwd: fixture('main-no-extension') })
  expect(out).toContain('Package size: 10 B')
  expect(code).toEqual(0)
})

it('uses index.js by default', async () => {
  let { out, code } = await run([], { cwd: fixture('defaults') })
  expect(out).toContain('Package size: 10 B')
  expect(code).toEqual(0)
})

it('shows results as JSON with --json argument', async () => {
  let { out, code } = await run(['--json'], { cwd: fixture('good') })
  let results = [
    {
      loading: 0.01,
      name: 'index.js',
      passed: true,
      running: 1,
      size: 10
    },
    {
      loading: 0.01,
      name: 'index2.js',
      passed: true,
      running: 1,
      size: 10
    },
    {
      loading: 0.01,
      name: 'index3.js',
      passed: true,
      running: 1,
      size: 10
    }
  ]
  JSON.parse(out).forEach((result, i) => {
    expect(result).toMatchObject(results[i])
  })
  expect(code).toEqual(0)
})

it('shows errors as JSON with --json argument', async () => {
  let { out, code } = await run(['--json'], { cwd: fixture('unknown') })
  expect(JSON.parse(out).error).toContain('Size Limit can\'t resolve')
  expect(code).toEqual(1)
})

it('does not print running in JSON on request', async () => {
  let { out, code } = await run(['--json', '--no-running-time'], {
    cwd: fixture('good')
  })
  expect(Object.keys(JSON.parse(out)[0])).not.toContain('running')
  expect(code).toEqual(0)
})

it('shows "on first job" warn as text with --json argument', async () => {
  let { out, code } = await run(['--json'], {}, {
    TRAVIS: '1', TRAVIS_JOB_NUMBER: '1.2'
  })
  expect(out).toEqual(
    'Size Limit runs only on first CI job, to save CI resources\n'
  )
  expect(code).toEqual(0)
})

it('save output bundle to absolute path', async () => {
  let { code } = await run(
    ['--save-bundle', ABSOLUTE_OUTPUT],
    { cwd: fixture('defaults') }
  )
  expect(existsSync(ABSOLUTE_OUTPUT)).toBeTruthy()
  expect(code).toEqual(0)
})

it('save output bundle to relative path', async () => {
  let { code } = await run(
    ['--save-bundle', '../../output-test'],
    { cwd: fixture('defaults') }
  )
  expect(existsSync(RELATIVE_OUTPUT)).toBeTruthy()
  expect(code).toEqual(0)
})
