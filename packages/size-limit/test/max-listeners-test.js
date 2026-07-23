import { join } from 'node:path'

import run from '../run.js'

process.args = ['node', 'size-limit']
process.cwd = function () {
  return join(
    import.meta.dirname,
    '..',
    '..',
    '..',
    'fixtures',
    'max-listeners'
  )
}

run(process)
