let chalk = require('chalk')
let { gte } = require('semver')
let { constants, createBrotliCompress, createGzip } = require('zlib')
let { promisify } = require('util')
let fs = require('fs')

let stat = promisify(fs.stat)
let brotliRequiredNodeVersion = 'v11.7.0'

async function sum (array, fn) {
  return (await Promise.all(array.map(fn))).reduce((all, i) => all + i, 0)
}

function brotliSize (path) {
  return new Promise((resolve, reject) => {
    let size = 0
    let pipe = fs.createReadStream(path).pipe(createBrotliCompress({
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11
      }
    }))
    pipe.on('error', reject)
    pipe.on('data', buf => {
      size += buf.length
    })
    pipe.on('end', () => {
      resolve(size)
    })
  })
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
  async step60 (config, check, nodeVersion = process.version) {
    let files = check.bundles || check.path

    if (check.brotli === true) {
      let isBrotliSupported = gte(nodeVersion, brotliRequiredNodeVersion)

      if (isBrotliSupported) {
        check.size = await sum(files, async i => brotliSize(i))

        return
      }
      process.stderr.write(
        chalk.yellow(`Brotli required node >= ${ brotliRequiredNodeVersion }\n`)
      )
    }

    if (check.gzip === false) {
      check.size = await sum(files, async i => (await stat(i)).size)
    } else {
      check.size = await sum(files, async i => gzipSize(i))
    }
  }
}

module.exports = [self]
