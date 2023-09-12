import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'

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
