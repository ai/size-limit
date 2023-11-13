import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { constants, createBrotliCompress, createGzip } from 'node:zlib'

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

      if (check.gzip === true) {
        check.size = await sum(files, async i => gzipSize(i))
      } else if (check.brotli === false) {
        check.size = await sum(files, async i => (await stat(i)).size)
      } else {
        check.size = await sum(files, async i => brotliSize(i))
      }
    }
  }
]
