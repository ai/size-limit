'use strict'

const spawn = require('cross-spawn')
const path = require('path')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

function fixture (file) {
  return path.join(__dirname, 'fixtures', file)
}

function run (args, options, env) {
  if (!options) options = { }
  options.env = {
    TRAVIS_JOB_NUMBER: '1.1',
    APPVEYOR_JOB_NUMBER: '1'
  }
  for (const i in process.env) {
    if (!options.env[i]) options.env[i] = process.env[i]
  }
  for (const i in env) {
    options.env[i] = env[i]
  }
  const cli = spawn(path.join(__dirname, '../cli.js'), args, options)
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

it('returns help', () => {
  return run(['--help']).then(result => {
    expect(result.out).toContain('Examples:')
    expect(result.code).toEqual(0)
  })
})

it('returns version', () => {
  return run(['--version']).then(result => {
    expect(result.out).toMatch(/\d+\.\d+\.\d+/)
    expect(result.code).toEqual(0)
  })
})

it('returns size', () => {
  return run(['test/fixtures/empty.js']).then(result => {
    expect(result.out).toEqual('\n' +
    '  Package size: 0 B\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n')
    expect(result.code).toEqual(0)
  })
})

it('uses different units', () => {
  return run(['test/fixtures/big.js']).then(result => {
    expect(result.out).toContain('2.38 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('supports absolute path', () => {
  return run([path.join(__dirname, 'fixtures/empty.js')]).then(result => {
    expect(result.out).toContain('0 B\n')
    expect(result.code).toEqual(0)
  })
})

it('reads package.json', () => {
  return run([], { cwd: fixture('main/dir') }).then(result => {
    expect(result.out).toContain('22 B\n')
    expect(result.code).toEqual(0)
  })
})

it('uses index.js by default', () => {
  return run([], { cwd: fixture('index/dir') }).then(result => {
    expect(result.out).toContain('20 B\n')
    expect(result.code).toEqual(0)
  })
})

it('shows resolve errors', () => {
  return run(['unknown.js']).then(result => {
    expect(result.out).toContain('unknown.js')
    expect(result.out).toMatch(/^Can't resolve/)
    expect(result.code).toEqual(1)
  })
})

it('shows package.json errors', () => {
  const cwd = path.dirname(path.dirname(__dirname))
  return run([], { cwd }).then(result => {
    expect(result.out).toEqual(
      'Specify project files or run in project dir with package.json\n')
    expect(result.code).toEqual(1)
  })
})

it('shows limit', () => {
  return run(['2KB', 'test/fixtures/empty.js']).then(result => {
    expect(result.out).toContain('Size limit:   2 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('shows small K', () => {
  return run(['2kB', 'test/fixtures/empty.js']).then(result => {
    expect(result.out).toContain('Size limit:   2 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('allows space in limit', () => {
  return run(['2', 'KB', 'test/fixtures/empty.js']).then(result => {
    expect(result.out).toContain('Size limit:   2 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('allows fractional in limit', () => {
  return run(['2.20KB', 'test/fixtures/empty.js']).then(result => {
    expect(result.out).toContain('Size limit:   2.2 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('allows unitless limit', () => {
  return run(['2048', 'test/fixtures/empty.js']).then(result => {
    expect(result.out).toContain('Size limit:   2 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('allows bytes', () => {
  return run(['2048B', 'test/fixtures/empty.js']).then(result => {
    expect(result.out).toContain('Size limit:   2 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('allows space and bytes', () => {
  return run(['2048', 'B', 'test/fixtures/empty.js']).then(result => {
    expect(result.out).toContain('Size limit:   2 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('checks limits', () => {
  return run(['2KB', 'test/fixtures/big.js']).then(result => {
    expect(result.out).toContain('exceeded the size limit')
    expect(result.code).toEqual(3)
  })
})

it('shows analyzer', () => {
  return run(['--why', 'test/fixtures/empty.js']).then(result => {
    expect(result.out).toContain('Webpack Bundle Analyzer')
    expect(result.code).toEqual(0)
  })
})

it('uses Babili', () => {
  return run(['--babili', 'test/fixtures/es2016.js']).then(result => {
    expect(result.out).toContain('39 B\n')
    expect(result.code).toEqual(0)
  })
})

it('runs only on first job in Travis CI', () => {
  const env = { TRAVIS: '1', TRAVIS_JOB_NUMBER: '1.2' }
  return run([], { }, env).then(result => {
    expect(result.out).toContain('first CI job')
    expect(result.code).toEqual(0)
  })
})

it('runs only on first job in AppVeyor', () => {
  const env = { APPVEYOR: '1', APPVEYOR_JOB_NUMBER: '2' }
  return run([], { }, env).then(result => {
    expect(result.out).toContain('first CI job')
    expect(result.code).toEqual(0)
  })
})
