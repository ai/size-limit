import { join } from 'path'

export default {
  input: join(__dirname, 'small.js'),
  output: { dir: join(__dirname, '..', 'dist'), minify: true }
}
