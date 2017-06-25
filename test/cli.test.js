'use strict'

const spawn = require('cross-spawn')

function run () {
  const cli = spawn('./cli.js', Array.prototype.slice.call(arguments, 0))
  return new Promise(resolve => {
    let out = ''
    cli.stdout.on('data', data => {
      out += data.toString()
    })
    cli.stderr.on('data', data => {
      out += data.toString()
    })
    cli.on('close', () => {
      resolve(out)
    })
  })
}

it('returns help', () => {
  return run('--help').then(out => {
    expect(out).toContain('Examples:')
  })
})

it('returns version', () => {
  return run('--version').then(out => {
    expect(out).toMatch(/\d+\.\d+\.\d+/)
  })
})

it('returns size', () => {
  return run('test/fixtures/empty.js').then(out => {
    expect(out).toEqual('0\n')
  })
})
