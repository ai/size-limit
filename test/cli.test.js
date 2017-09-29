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

function configError (msg) {
  return ' ERROR  ' + msg + '\n' +
         '        Fix it according to Size Limit docs.\n' +
         '\n' +
         '  "size-limit": ['
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
      '        Be sure that you run Size Limit inside project dir.\n')
    expect(result.code).toEqual(1)
  })
})

it('shows size-limit section error', () => {
  return run([], { cwd: fixture('missed') }).then(result => {
    expect(result.out).toContain(
      ' ERROR  Can not find "size-limit" section in package.json.\n' +
      '        Add it according to Size Limit docs.\n' +
      '\n' +
      '  "size-limit": [')
    expect(result.code).toEqual(1)
  })
})

it('shows size-limit type error', () => {
  return run([], { cwd: fixture('type') }).then(result => {
    expect(result.out).toContain(configError(
      'The "size-limit" section of package.json must be an array.'
    ))
    expect(result.code).toEqual(1)
  })
})

it('shows size-limit content error', () => {
  return run([], { cwd: fixture('wrong') }).then(result => {
    expect(result.out).toContain(configError(
      'The path in Size Limit config must be a string or an array of strings.'
    ))
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

it('supports ES2016', () => {
  return run([], { cwd: fixture('es2016') }).then(result => {
    expect(result.out).toContain('34 B\n')
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
    expect(result.out).toContain('exceeded by 384 B')
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
    expect(result.out).toContain('2.38 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('shows bytes if value is same in different units', () => {
  return run([], { cwd: fixture('exact') }).then(result => {
    expect(result.out).toContain('Package size: 1854 B')
    expect(result.out).toContain('Size limit:   1853 B')
    expect(result.code).toEqual(3)
  })
})

it('supports absolute path', () => {
  const file = path.join(__dirname, 'fixtures/unlimit/empty.js')
  return run([file]).then(result => {
    expect(result.out).toContain('0 B\n')
    expect(result.code).toEqual(0)
  })
})

it('ignores peerDependencies', () => {
  return run([], { cwd: fixture('peer') }).then(result => {
    expect(result.out).toContain('93 B\n')
    expect(result.code).toEqual(0)
  })
})

it('disables webpack by argument', () => {
  return run(['--no-webpack', 'test/fixtures/bad/index.js']).then(result => {
    expect(result.out).toContain('51 B\n')
    expect(result.code).toEqual(0)
  })
})

it('disables webpack by option', () => {
  return run([], { cwd: fixture('bundled') }).then(result => {
    expect(result.out).toContain('51 B\n')
    expect(result.code).toEqual(0)
  })
})

it('throws on --why with disabled webpack', () => {
  return run(['--why'], { cwd: fixture('bundled') }).then(result => {
    expect(result.out).toContain('--why does not work')
    expect(result.code).toEqual(1)
  })
})
