let spawn = require('cross-spawn')
let path = require('path')

function fixture (file) {
  return path.join(__dirname, 'fixtures', file)
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
  expect(out).toEqual(
    '\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n'
  )
  expect(code).toEqual(0)
})

it('uses .size-limit.js file config', async () => {
  let { out, code } = await run([], { cwd: fixture('js') })
  expect(out).toEqual(
    '\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n'
  )
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
    '  Package size: 0 B\n' +
    '  With all dependencies, minified and gzipped\n' +
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
    '  Package size: 10 B\n' +
    '\n' +
    '  index2.js\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B\n' +
    '\n' +
    '  index3.js\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B\n' +
    '\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n'
  )
  expect(code).toEqual(0)
})

it('accepts array for path', async () => {
  let { out, code } = await run([], { cwd: fixture('array') })
  expect(out).toEqual(
    '\n' +
    '  index1.js\n' +
    '  Package size: 14 B\n' +
    '\n' +
    '  index1.js, index2.js\n' +
    '  Package size: 23 B\n' +
    '\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n'
  )
  expect(code).toEqual(0)
})

it('supports glob patterns', async () => {
  let { out, code } = await run([], { cwd: fixture('glob') })
  expect(out).toContain('Package size: 10 B\n')
  expect(code).toEqual(0)
})

it('supports ES2016', async () => {
  let { out, code } = await run([], { cwd: fixture('es2016') })
  expect(out).toContain('Package size: 25 B\n')
  expect(code).toEqual(0)
})

it('supports multiple files', async () => {
  let { out, code } = await run([], { cwd: fixture('multiple') })
  expect(out).toContain('Package size: 16 B\n')
  expect(code).toEqual(0)
})

it('checks limits', async () => {
  let { out, code } = await run([], { cwd: fixture('bad') })
  expect(out).toContain('exceeded by 383 B')
  expect(code).toEqual(3)
})

it('uses names', async () => {
  let { out, code } = await run([], { cwd: fixture('named') })
  expect(out).toEqual(
    '\n' +
    '  First\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B\n' +
    '\n' +
    '  Second\n' +
    '  Size limit:   1 KB\n' +
    '  Package size: 10 B\n' +
    '\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n'
  )
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

it('returns size', async () => {
  let { out, code } = await run(['test/fixtures/unlimit/empty.js'])
  expect(out).toEqual(
    '\n' +
    '  Package size: 0 B\n' +
    '  With all dependencies, minified and gzipped\n' +
    '\n'
  )
  expect(code).toEqual(0)
})

it('uses limit in non-config mode', async () => {
  let file = 'test/fixtures/unlimit/empty.js'
  let { out, code } = await run(['--limit', '10 KB', file])
  expect(out).toContain('Size limit:   10 KB\n')
  expect(code).toEqual(0)
})

it('uses different units', async () => {
  let { out, code } = await run(['test/fixtures/bad/index.js'])
  expect(out).toContain('Package size: 2.37 KB\n')
  expect(code).toEqual(0)
})

it('supports absolute path', async () => {
  let file = path.join(__dirname, 'fixtures/unlimit/empty.js')
  let { out, code } = await run([file])
  expect(out).toContain('Package size: 0 B\n')
  expect(code).toEqual(0)
})

it('ignores peerDependencies', async () => {
  let { out, code } = await run([], { cwd: fixture('peer') })
  expect(out).toContain('Package size: 22 B\n')
  expect(code).toEqual(0)
})

it('supports ignore option', async () => {
  let { out, code } = await run([], { cwd: fixture('ignore') })
  expect(out).toContain('Package size: 22 B\n')
  expect(code).toEqual(0)
})

it('disables webpack by argument', async () => {
  let { out, code } = await run(['--no-webpack', 'test/fixtures/bad/index.js'])
  expect(out).toContain('Package size: 37 B\n')
  expect(code).toEqual(0)
})

it('disables webpack by option', async () => {
  let { out, code } = await run([], { cwd: fixture('bundled') })
  expect(out).toContain('Package size: 37 B\n')
  expect(code).toEqual(0)
})

it('disables gzip by argument', async () => {
  let { out, code } = await run(['--no-gzip', 'test/fixtures/bad/index.js'])
  expect(out).toContain('Package size: 6.95 KB\n')
  expect(code).toEqual(0)
})

it('disables gzip by option', async () => {
  let { out, code } = await run([], { cwd: fixture('gzip') })
  expect(out).toContain('Package size: 14 B\n')
  expect(code).toEqual(0)
})

it('throws on --why with disabled webpack', async () => {
  let { out, code } = await run(['--why'], { cwd: fixture('bundled') })
  expect(out).toContain('--why does not work')
  expect(code).toEqual(1)
})

it('uses custom webpack', async () => {
  let { out, code } = await run([], { cwd: fixture('webpack-config') })
  expect(out).toContain('Package size: 2.84 KB')
  expect(code).toEqual(0)
})

it('uses custom webpack when specified via --config', async () => {
  let { out, code } = await run([
    '--config', fixture('webpack-config/webpack.config.js'),
    fixture('webpack-config/index.js')
  ])
  expect(out).toContain('Package size: 3.01 KB')
  expect(code).toEqual(0)
})

it('uses entry to support webpack multiple entry points', async () => {
  let { out, code } = await run([], {
    cwd: fixture('webpack-multipe-entry-points')
  })
  expect(out).toContain('Package size: 12.65')
  expect(code).toEqual(0)
})

it('uses main from package.json', async () => {
  let { out, code } = await run([], { cwd: fixture('main') })
  expect(out).toContain('Package size: 10 B\n')
  expect(code).toEqual(0)
})

it('uses index.js by default', async () => {
  let { out, code } = await run([], { cwd: fixture('defaults') })
  expect(out).toContain('Package size: 10 B\n')
  expect(code).toEqual(0)
})
