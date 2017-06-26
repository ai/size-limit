'use strict'

const spawn = require('cross-spawn')
const path = require('path')

function fixture (file) {
  return path.join(__dirname, 'fixtures', file)
}

function run (args, options) {
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
    expect(result.code).toEqual(0)
    expect(result.out).toContain('Examples:')
  })
})

it('returns version', () => {
  return run(['--version']).then(result => {
    expect(result.code).toEqual(0)
    expect(result.out).toMatch(/\d+\.\d+\.\d+/)
  })
})

it('returns size', () => {
  return run(['test/fixtures/empty.js']).then(result => {
    expect(result.code).toEqual(0)
    expect(result.out).toEqual('0 B\n')
  })
})

it('uses different units', () => {
  return run(['test/fixtures/big.js']).then(result => {
    expect(result.code).toEqual(0)
    expect(result.out).toEqual('1.86 KB\n')
  })
})

it('supports absolute path', () => {
  return run([path.join(__dirname, 'fixtures/empty.js')]).then(result => {
    expect(result.code).toEqual(0)
    expect(result.out).toEqual('0 B\n')
  })
})

it('reads package.json', () => {
  return run([], { cwd: fixture('main/dir') }).then(result => {
    expect(result.code).toEqual(0)
    expect(result.out).toEqual('22 B\n')
  })
})

it('uses index.js by default', () => {
  return run([], { cwd: fixture('index/dir') }).then(result => {
    expect(result.code).toEqual(0)
    expect(result.out).toEqual('20 B\n')
  })
})

it('shows resolve errors', () => {
  return run(['unknown.js']).then(result => {
    expect(result.code).toEqual(1)
    expect(result.out).toContain('unknown.js')
    expect(result.out).toMatch(/^Can't resolve/)
  })
})

it('shows package.json errors', () => {
  const cwd = path.dirname(path.dirname(__dirname))
  return run([], { cwd }).then(result => {
    expect(result.code).toEqual(1)
    expect(result.out).toEqual(
      'Specify project files or run in project dir with package.json\n')
  })
})
