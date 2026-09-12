import { join } from 'path'

export default {
  input: [join(__dirname, 'file.js'), join(__dirname, 'small.js')],
  output: {
    dir: join(__dirname, '..', '..', 'dist'),
    entryFileNames: '[name].[hash].js',
    minify: false
  }
}
