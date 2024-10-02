import fs from 'node:fs/promises'

export async function rm(dir) {
  await fs.rm(dir, { force: true, recursive: true })
}
