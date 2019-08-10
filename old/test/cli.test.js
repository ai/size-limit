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

it('shows resolve errors', async () => {
  let { out, code } = await run([], { cwd: fixture('unknown') })
  expect(out).toContain('unknown.js')
  expect(out).toMatch(/Size Limit can't resolve/)
  expect(code).toEqual(1)
})

it('supports ES2016', async () => {
  let { out, code } = await run([], { cwd: fixture('es2016') })
  expect(out).toContain('Package size: 25 B')
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

it('supports ignore option', async () => {
  let { out, code } = await run([], { cwd: fixture('ignore') })
  expect(out).toContain('Package size: 9 B')
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

it('uses entry to support webpack multiple entry points', async () => {
  let { out, code } = await run([], {
    cwd: fixture('webpack-multipe-entry-points')
  })
  expect(out).toContain(
    'Package size: 12.8 KB with given webpack configuration'
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
