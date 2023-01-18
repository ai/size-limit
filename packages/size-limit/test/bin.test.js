let { join } = require('path')
let spawn = require('cross-spawn')

const BIN_PATH = join(__dirname, '../bin.js')

function run(args, env = {}) {
  let cli = spawn(BIN_PATH, args, { env: { ...process.env, ...env } })
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

it('passes process to runner', async () => {
  let { out, code } = await run(['--version'], {
    TRAVIS: '1',
    TRAVIS_JOB_NUMBER: '1.1'
  })
  expect(out).toMatch(/size-limit \d+.\d+.\d+/)
  expect(code).toBe(0)
})
