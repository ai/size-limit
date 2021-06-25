let SizeLimitError = require('size-limit/size-limit-error')
let { spawn } = require('child_process')
let { join } = require('path')
let rm = require('size-limit/rm')

let self = {
  name: '@size-limit/dual-publish',

  wait10: 'Compiling files to ESM',
  async all10(config) {
    let stderr = ''
    let cmd = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['-y', '-q', 'dual-publish', '--check'],
      { cwd: config.cwd }
    )
    cmd.stderr.on('data', data => {
      stderr += data.toString().replace(/^ ERROR {2}/, '')
    })
    await new Promise((resolve, reject) => {
      cmd.on('close', code => {
        if (code !== 0 || stderr) {
          reject(new SizeLimitError('cmdError', 'dual-publish', stderr))
        } else {
          resolve()
        }
      })
      cmd.on('error', reject)
    })
    for (let check of config.checks) {
      check.files = check.files.map(i => {
        return join(
          config.cwd,
          'dual-publish-tmp',
          i.slice(config.cwd.length + 1)
        )
      })
      if (check.import) {
        let imports = {}
        for (let i in check.import) {
          if (!i.includes('node_modules')) {
            let changed = join(
              config.cwd,
              'dual-publish-tmp',
              i.slice(config.cwd.length + 1)
            )
            imports[changed] = check.import[i]
          } else {
            imports[i] = check.import[i]
          }
        }
        check.import = imports
      }
    }
  },

  async finally(config) {
    await rm(join(config.cwd, 'dual-publish-tmp'))
  }
}

module.exports = [self]
