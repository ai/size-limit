import { join } from 'path'

export default async () => ({
  input: [join(__dirname, 'file.js'), join(__dirname, 'small.js')],
  output: {
    dir: join(__dirname, '..', '..', 'dist'),
    minify: false
  }
})
