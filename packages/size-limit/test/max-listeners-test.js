import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import run from '../run.js'

process.args = ['node', 'size-limit']
process.cwd = function () {
  return join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'fixtures',
    'max-listeners'
  )
}

run(process)
