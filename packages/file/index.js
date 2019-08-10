let { createGzip } = require('zlib')
let { promisify } = require('util')
let fs = require('fs')

let stat = promisify(fs.stat)

async function sum (array, fn) {
  return (await Promise.all(array.map(fn))).reduce((all, i) => all + i, 0)
}

function gzipSize (path) {
  return new Promise((resolve, reject) => {
    let size = 0
    let pipe = fs.createReadStream(path).pipe(createGzip({ level: 9 }))
    pipe.on('error', reject)
    pipe.on('data', buf => {
      size += buf.length
    })
    pipe.on('end', () => {
      resolve(size)
    })
  })
}

let self = {
  name: '@size-limit/file',
  async step60 (config, check) {
    let files = check.bundles || check.path
    if (check.gzip === false) {
      check.size = await sum(files, async i => (await stat(i)).size)
    } else {
      check.size = await sum(files, async i => gzipSize(i))
    }
  }
}

module.exports = [self]
