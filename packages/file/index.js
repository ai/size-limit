import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { gte } from 'semver'
import { SizeLimitError } from 'size-limit/size-limit-error.js'
import { constants, createBrotliCompress, createGzip } from 'zlib'

const BROTLI_NODE_VERSION = 'v11.7.0'

async function sum(array, fn) {
  return (await Promise.all(array.map(fn))).reduce((all, i) => all + i, 0)
}

function brotliSize(path) {
  return new Promise((resolve, reject) => {
    let size = 0
    let pipe = createReadStream(path).pipe(
      createBrotliCompress({
        params: {
          [constants.BROTLI_PARAM_QUALITY]: 11
        }
      })
    )
    pipe.on('error', reject)
    pipe.on('data', buf => {
      size += buf.length
    })
    pipe.on('end', () => {
      resolve(size)
    })
  })
}

function gzipSize(path) {
  return new Promise((resolve, reject) => {
    let size = 0
    let pipe = createReadStream(path).pipe(createGzip({ level: 9 }))
    pipe.on('error', reject)
    pipe.on('data', buf => {
      size += buf.length
    })
    pipe.on('end', () => {
      resolve(size)
    })
  })
}

export default [
  {
    name: '@size-limit/file',
    async step60(_config, check) {
      let files = check.bundles || check.files

      if (check.brotli === true) {
        if (!gte(process.version, BROTLI_NODE_VERSION)) {
          throw new SizeLimitError('brotliUnsupported')
        }
        check.size = await sum(files, async i => brotliSize(i))
      } else if (check.gzip === false) {
        check.size = await sum(files, async i => (await stat(i)).size)
      } else {
        check.size = await sum(files, async i => gzipSize(i))
      }
    }
  }
]
