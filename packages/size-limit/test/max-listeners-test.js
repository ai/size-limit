import { join } from 'path'
import { fileURLToPath } from 'url'

import run from '../run.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

process.args = ['node', 'size-limit']
process.cwd = function () {
  return join(__dirname, '..', '..', '..', 'fixtures', 'max-listeners')
}

run(process)
