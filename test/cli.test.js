let spawn = require('cross-spawn')
let path = require('path')

function fixture (file) {
  return path.join(__dirname, 'fixtures', file)
}

function run (args, options, env) {
  if (!options) options = { }
  options.env = {
    TRAVIS_JOB_NUMBER: '1.1',
    APPVEYOR_JOB_NUMBER: '1'
  }
  for (let i in process.env) {
    if (!options.env[i]) options.env[i] = process.env[i]
  }
  for (let i in env) {
    options.env[i] = env[i]
  }
  let cli = spawn(path.join(__dirname, '../cli.js'), args, options)
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

it('shows size-limit section error', () => {
  return run([], { cwd: fixture('missed') }).then(result => {
    expect(result.out).toContain(
      ' ERROR  Can not find settings for Size Limit.\n' +
      '        Add it to section "size-limit" in package.json ' +
      'according to Size Limit docs.\n' +
      '\n' +
      '  "size-limit": [')
    expect(result.code).toEqual(1)
  })
})

describe('wrong size-limit section content in package.json', () => {
  function configErrorInPackage (msg) {
    return ' ERROR  ' + msg + '\n' +
           '        Fix it according to Size Limit docs.\n' +
           '\n' +
           '  "size-limit": ['
  }

  it('shows size-limit type error', () => {
    return run([], { cwd: fixture('type') }).then(result => {
      expect(result.out).toContain(configErrorInPackage(
        'The "size-limit" section of package.json must be an array.'
      ))
      expect(result.code).toEqual(1)
    })
  })

  it('shows size-limit section content error with wrong path', () => {
    return run([], { cwd: fixture('wrong-package/notString-path') })
      .then(result => {
        expect(result.out).toContain(configErrorInPackage(
          'The path in the "size-limit" section of package.json must be ' +
          'a string or an array of strings.'
        ))
        expect(result.code).toEqual(1)
      })
  })

  it('shows size-limit section content error with wrong entry', () => {
    return run([], { cwd: fixture('wrong-package/notString-entry') })
      .then(result => {
        expect(result.out).toContain(configErrorInPackage(
          'The entry in the "size-limit" section of package.json must be ' +
          'a string or an array of strings.'
        ))
        expect(result.code).toEqual(1)
      })
  })
})

describe('wrong config content in size-limit config file', () => {
  function configErrorInConfig (msg) {
    return ' ERROR  ' + msg + '\n' +
           '        Fix it according to Size Limit docs.\n' +
           '\n' +
           '  [\n'
  }

  it('shows empty content error', () => {
    return run([], { cwd: fixture('wrong-config/empty') }).then(result => {
      expect(result.out).toContain(configErrorInConfig(
        'Size Limit config must not be empty.'
      ))
      expect(result.code).toEqual(1)
    })
  })

  it('shows not string error with wrong entry', () => {
    return run([], { cwd: fixture('wrong-config/notString-entry') })
      .then(result => {
        expect(result.out).toContain(configErrorInConfig(
          'The entry in Size Limit config must be a string or an array of ' +
          'strings.'
        ))
        expect(result.code).toEqual(1)
      })
  })
})

it('uses .size-limit file config', () => {
  return run([], { cwd: fixture('config') }).then(result => {
    expect(result.out).toEqual('\n' +
    '  Package size: 10 B\n' +
    '  Size limit:   1 KB\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n')
    expect(result.code).toEqual(0)
  })
})

it('uses .size-limit.js file config', () => {
  return run([], { cwd: fixture('js') }).then(result => {
    expect(result.out).toEqual('\n' +
    '  Package size: 10 B\n' +
    '  Size limit:   1 KB\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n')
    expect(result.code).toEqual(0)
  })
})

it('overrides config by limit argument', () => {
  return run(['--limit', '1B'], { cwd: fixture('config') }).then(result => {
    expect(result.out).toContain('Size limit:   1 B\n')
    expect(result.code).toEqual(3)
  })
})

it('shows .size-limit error', () => {
  return run([], { cwd: fixture('bad-config') }).then(result => {
    expect(result.out).toContain(
      ' ERROR  Can not parse .size-limit at 3:4.\n' +
      '        Missed comma between flow collection entries.'
    )
    expect(result.code).toEqual(1)
  })
})

it('shows package.json error', () => {
  return run([], { cwd: fixture('bad-package') }).then(result => {
    expect(result.out).toContain(
      ' ERROR  Can not parse package.json.\n' +
      '        Unexpected string'
    )
    expect(result.code).toEqual(1)
  })
})

it('runs only on first job in Travis CI', () => {
  let env = { TRAVIS: '1', TRAVIS_JOB_NUMBER: '1.2' }
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
    '  Package size: 10 B\n' +
    '  Size limit:   1 KB\n' +
    '\n' +
    '  index2.js\n' +
    '  Package size: 10 B\n' +
    '  Size limit:   1 KB\n' +
    '\n' +
    '  index3.js\n' +
    '  Package size: 10 B\n' +
    '  Size limit:   1 KB\n' +
    '\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n')
    expect(result.code).toEqual(0)
  })
})

it('accepts array for path', () => {
  return run([], { cwd: fixture('array') }).then(result => {
    expect(result.out).toEqual('\n' +
    '  index1.js\n' +
    '  Package size: 14 B\n' +
    '\n' +
    '  index1.js, index2.js\n' +
    '  Package size: 23 B\n' +
    '\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n')
    expect(result.code).toEqual(0)
  })
})

it('supports glob patterns', () => {
  return run([], { cwd: fixture('glob') }).then(result => {
    expect(result.out).toContain('Package size: 10 B\n')
    expect(result.code).toEqual(0)
  })
})

it('supports ES2016', () => {
  return run([], { cwd: fixture('es2016') }).then(result => {
    expect(result.out).toContain('Package size: 25 B\n')
    expect(result.code).toEqual(0)
  })
})

it('supports multiple files', () => {
  return run([], { cwd: fixture('multiple') }).then(result => {
    expect(result.out).toContain('Package size: 16 B\n')
    expect(result.code).toEqual(0)
  })
})

it('checks limits', () => {
  return run([], { cwd: fixture('bad') }).then(result => {
    expect(result.out).toContain('exceeded by 391 B')
    expect(result.code).toEqual(3)
  })
})

it('uses names', () => {
  return run([], { cwd: fixture('named') }).then(result => {
    expect(result.out).toEqual('\n' +
    '  First\n' +
    '  Package size: 10 B\n' +
    '  Size limit:   1 KB\n' +
    '\n' +
    '  Second\n' +
    '  Package size: 10 B\n' +
    '  Size limit:   1 KB\n' +
    '\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n')
    expect(result.code).toEqual(0)
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
    expect(result.out.match(/Webpack Bundle Analyzer/g)).toHaveLength(1)
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

it('uses limit in non-config mode', () => {
  let file = 'test/fixtures/unlimit/empty.js'
  return run(['--limit', '10 KB', file]).then(result => {
    expect(result.out).toContain('Size limit:   10 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('uses different units', () => {
  return run(['test/fixtures/bad/index.js']).then(result => {
    expect(result.out).toContain('Package size: 2.38 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('supports absolute path', () => {
  let file = path.join(__dirname, 'fixtures/unlimit/empty.js')
  return run([file]).then(result => {
    expect(result.out).toContain('Package size: 0 B\n')
    expect(result.code).toEqual(0)
  })
})

it('ignores peerDependencies', () => {
  return run([], { cwd: fixture('peer') }).then(result => {
    expect(result.out).toContain('Package size: 22 B\n')
    expect(result.code).toEqual(0)
  })
})

it('supports ignore option', () => {
  return run([], { cwd: fixture('ignore') }).then(result => {
    expect(result.out).toContain('Package size: 22 B\n')
    expect(result.code).toEqual(0)
  })
})

it('disables webpack by argument', () => {
  return run(['--no-webpack', 'test/fixtures/bad/index.js']).then(result => {
    expect(result.out).toContain('Package size: 37 B\n')
    expect(result.code).toEqual(0)
  })
})

it('disables webpack by option', () => {
  return run([], { cwd: fixture('bundled') }).then(result => {
    expect(result.out).toContain('Package size: 37 B\n')
    expect(result.code).toEqual(0)
  })
})

it('disables gzip by argument', () => {
  return run(['--no-gzip', 'test/fixtures/bad/index.js']).then(result => {
    expect(result.out).toContain('Package size: 6.96 KB\n')
    expect(result.code).toEqual(0)
  })
})

it('disables gzip by option', () => {
  return run([], { cwd: fixture('gzip') }).then(result => {
    expect(result.out).toContain('Package size: 14 B\n')
    expect(result.code).toEqual(0)
  })
})

it('throws on --why with disabled webpack', () => {
  return run(['--why'], { cwd: fixture('bundled') }).then(result => {
    expect(result.out).toContain('--why does not work')
    expect(result.code).toEqual(1)
  })
})

it('uses custom webpack', () => {
  return run([], { cwd: fixture('webpack-config') }).then(result => {
    expect(result.out).toContain('Package size: 2.84 KB')
    expect(result.code).toEqual(0)
  })
})

it('uses custom webpack when specified via --config', () => {
  return run([
    '--config', fixture('webpack-config/webpack.config.js'),
    fixture('webpack-config/index.js')
  ]).then(result => {
    expect(result.out).toContain('Package size: 3.01 KB')
    expect(result.code).toEqual(0)
  })
})

it('uses main from package.json', () => {
  return run([], { cwd: fixture('main') }).then(result => {
    expect(result.out).toContain('Package size: 10 B\n')
    expect(result.code).toEqual(0)
  })
})

it('uses index.js by default', () => {
  return run([], { cwd: fixture('defaults') }).then(result => {
    expect(result.out).toContain('Package size: 10 B\n')
    expect(result.code).toEqual(0)
  })
})
