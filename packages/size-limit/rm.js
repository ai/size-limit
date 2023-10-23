import { existsSync } from 'fs'
import fs from 'fs/promises'

export default async function rm(dir) {
  if (!fs.rm) {
    /* istanbul ignore next */
    if (existsSync(dir)) {
      await fs.rmdir(dir, { recursive: true })
    }
  } else {
    await fs.rm(dir, { force: true, recursive: true })
  }
}
