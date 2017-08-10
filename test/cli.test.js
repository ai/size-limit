'use strict'

const spawn = require('cross-spawn')
const path = require('path')

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
    expect(result.out).toContain('Options:')
    expect(result.code).toEqual(0)
  })
})

it('returns version', () => {
  return run(['--version']).then(result => {
    expect(result.out).toMatch(/\d+\.\d+\.\d+/)
    expect(result.code).toEqual(0)
  })
})

it('shows resolve errors', () => {
  return run([], { cwd: fixture('unknown') }).then(result => {
    expect(result.out).toContain('unknown.js')
    expect(result.out).toMatch(/Size Limit can't resolve/)
    expect(result.code).toEqual(1)
  })
})

it('shows package.json error', () => {
  const cwd = path.dirname(path.dirname(__dirname))
  return run([], { cwd }).then(result => {
    expect(result.out).toEqual(
      ' ERROR  Can not find package.json.\n' +
      '        Be sure that your run Size Limit inside project dir.\n')
    expect(result.code).toEqual(1)
  })
})

it('shows size-limit section error', () => {
  return run([], { cwd: fixture('missed') }).then(result => {
    expect(result.out).toEqual(
      ' ERROR  Can not find size-limit section in package.json.\n' +
      '        Add it according Size Limit docs.\n')
    expect(result.code).toEqual(1)
  })
})

it('runs only on first job in Travis CI', () => {
  const env = { TRAVIS: '1', TRAVIS_JOB_NUMBER: '1.2' }
  return run([], { }, env).then(result => {
    expect(result.out).toContain('first CI job')
    expect(result.code).toEqual(0)
  })
})

it('shows size without limit', () => {
  return run([], { cwd: fixture('unlimit') }).then(result => {
    expect(result.out).toEqual('\n' +
    '  Package size: 0 B\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n')
    expect(result.code).toEqual(0)
  })
})

it('shows limit', () => {
  return run([], { cwd: fixture('good') }).then(result => {
    expect(result.out).toEqual('\n' +
    '  index.js\n' +
    '  Package size: 20 B\n' +
    '  Size limit:   1 KB\n' +
    '\n' +
    '  index2.js\n' +
    '  Package size: 20 B\n' +
    '  Size limit:   1 KB\n' +
    '\n' +
    '  index3.js\n' +
    '  Package size: 20 B\n' +
    '  Size limit:   1 KB\n' +
    '\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n')
    expect(result.code).toEqual(0)
  })
})

it('supports glob patterns', () => {
  return run([], { cwd: fixture('glob') }).then(result => {
    expect(result.out).toContain('20 B\n')
    expect(result.code).toEqual(0)
  })
})

it('uses Babili', () => {
  return run([], { cwd: fixture('es2016') }).then(result => {
    expect(result.out).toContain('39 B\n')
    expect(result.code).toEqual(0)
  })
})

it('supports multiple files', () => {
  return run([], { cwd: fixture('multiple') }).then(result => {
    expect(result.out).toContain('25 B\n')
    expect(result.code).toEqual(0)
  })
})

it('checks limits', () => {
  return run([], { cwd: fixture('bad') }).then(result => {
    expect(result.out).toContain('exceeded the size limit')
    expect(result.code).toEqual(3)
  })
})

it('shows analyzer', () => {
  return run(['--why'], { cwd: fixture('unlimit') }).then(result => {
    expect(result.out).toContain('Webpack Bundle Analyzer')
    expect(result.code).toEqual(0)
  })
})

it('shows analyzer for multiple limits', () => {
  return run(['--why'], { cwd: fixture('good') }).then(result => {
    expect(result.out.match(/Webpack Bundle Analyzer/g).length).toEqual(1)
    expect(result.code).toEqual(0)
  })
})

describe('legacy CLI API', () => {
  it('returns size', () => {
    return run(['test/fixtures/unlimit/empty.js']).then(result => {
      expect(result.out).toEqual('\n' +
      '  Package size: 0 B\n' +
      '  With all dependencies, minified and gzipped\n' +
      '\n')
      expect(result.code).toEqual(0)
    })
  })

  it('uses different units', () => {
    return run(['test/fixtures/bad/index.js']).then(result => {
      expect(result.out).toContain('2.39 KB\n')
      expect(result.code).toEqual(0)
    })
  })

  it('supports absolute path', () => {
    const file = path.join(__dirname, 'fixtures/unlimit/empty.js')
    return run([file]).then(result => {
      expect(result.out).toContain('0 B\n')
      expect(result.code).toEqual(0)
    })
  })

  it('shows limit', () => {
    return run(['2KB', 'test/fixtures/unlimit/empty.js']).then(result => {
      expect(result.out).toContain('Size limit:   2 KB\n')
      expect(result.code).toEqual(0)
    })
  })

  it('shows small K', () => {
    return run(['2kB', 'test/fixtures/unlimit/empty.js']).then(result => {
      expect(result.out).toContain('Size limit:   2 KB\n')
      expect(result.code).toEqual(0)
    })
  })

  it('allows space in limit', () => {
    return run(['2', 'KB', 'test/fixtures/unlimit/empty.js']).then(result => {
      expect(result.out).toContain('Size limit:   2 KB\n')
      expect(result.code).toEqual(0)
    })
  })

  it('allows fractional in limit', () => {
    return run(['2.20KB', 'test/fixtures/unlimit/empty.js']).then(result => {
      expect(result.out).toContain('Size limit:   2.2 KB\n')
      expect(result.code).toEqual(0)
    })
  })

  it('allows unitless limit', () => {
    return run(['2048', 'test/fixtures/unlimit/empty.js']).then(result => {
      expect(result.out).toContain('Size limit:   2 KB\n')
      expect(result.code).toEqual(0)
    })
  })

  it('allows bytes', () => {
    return run(['2048B', 'test/fixtures/unlimit/empty.js']).then(result => {
      expect(result.out).toContain('Size limit:   2 KB\n')
      expect(result.code).toEqual(0)
    })
  })

  it('allows space and bytes', () => {
    return run(['2048', 'B', 'test/fixtures/unlimit/empty.js']).then(result => {
      expect(result.out).toContain('Size limit:   2 KB\n')
      expect(result.code).toEqual(0)
    })
  })

  it('checks limits', () => {
    return run(['2KB', 'test/fixtures/bad/index.js']).then(result => {
      expect(result.out).toContain('exceeded the size limit')
      expect(result.code).toEqual(3)
    })
  })

  it('uses Babili', () => {
    return run(['--babili', 'test/fixtures/es2016/index.js']).then(result => {
      expect(result.out).toContain('39 B\n')
      expect(result.code).toEqual(0)
    })
  })
})
