let { existsSync } = require('fs')
let fs = require('fs/promises')

module.exports = async function rm(dir) {
  if (process.version.startsWith('v12.')) {
    /* istanbul ignore next */
    if (existsSync(dir)) {
      await fs.rmdir(dir, { recursive: true })
    }
  } else {
    await fs.rm(dir, { recursive: true, force: true })
  }
}
