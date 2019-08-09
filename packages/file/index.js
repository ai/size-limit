let { promisify } = require('util')
let fs = require('fs')

let stat = promisify(fs.stat)

let self = {
  name: '@size-limit/file',
  async step50 (modules, config, check) {
    let sizes = await Promise.all(check.path.map(async i => {
      return (await stat(i)).size
    }))
    check.size = sizes.reduce((sum, i) => sum + i, 0)
  }
}

module.exports = [self]
