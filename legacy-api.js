'use strict'

const bytes = require('bytes')
const path = require('path')

module.exports = function legacyApi (argv) {
  const files = argv['_'].slice(0)

  let limit
  if (/^\d+(\.\d+|)$/.test(files[0]) && /^[kKMGT]?B$/.test(files[1])) {
    limit = bytes.parse(`${ files.shift() } ${ files.shift() }`)
  } else if (/^\d+(\.\d+|)?([kKMGT]B|B)?$/.test(files[0])) {
    limit = bytes.parse(files.shift())
  }

  const full = files.map(i => {
    if (path.isAbsolute(i)) {
      return i
    } else {
      return path.join(process.cwd(), i)
    }
  })

  return Promise.resolve([{ path: files, babili: argv.babili, full, limit }])
}
