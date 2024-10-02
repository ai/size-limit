import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'

export async function rm(dir) {
  if (!fs.rm) {
    /* c8 ignore next 3 */
    if (existsSync(dir)) {
      await fs.rmdir(dir, { maxRetries: 3, recursive: true })
    }
  } else {
    await fs.rm(dir, { force: true, maxRetries: 3, recursive: true })
  }
}
