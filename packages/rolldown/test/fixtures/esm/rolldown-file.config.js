import { join } from 'path'

export default {
  input: join(__dirname, 'small.js'),
  output: {
    file: join(__dirname, '..', '..', 'dist', 'out.js'),
    minify: false
  }
}
