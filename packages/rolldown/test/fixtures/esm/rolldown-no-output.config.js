import { join } from 'path'

// Without `output.dir` Rolldown writes to `dist` inside `cwd`
export default {
  cwd: join(__dirname, '..', '..'),
  input: [join(__dirname, 'small.js')]
}
