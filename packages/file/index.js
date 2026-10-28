import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { constants, createBrotliCompress, createGzip } from 'node:zlib'

async function sum(array, fn) {
  return (await Promise.all(array.map(fn))).reduce((all, i) => all + i, 0)
}

async function brotliSize(path) {
  let size = 0
  let pipe = createBrotliCompress({
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11
    }
  })
  await pipeline(createReadStream(path), pipe, async source => {
    for await (let buf of source) size += buf.length
  })
  return size
}

async function gzipSize(path) {
  let size = 0
  let pipe = createGzip({ level: 9 })
  await pipeline(createReadStream(path), pipe, async source => {
    for await (let buf of source) size += buf.length
  })
  return size
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
