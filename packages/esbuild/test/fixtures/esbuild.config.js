import { join } from 'path'

export default {
  entryPoints: [join(__dirname, 'cjs/file.js'), join(__dirname, 'small.js')],
  outdir: join(process.cwd(), 'dist'),
  bundle: true,
  minify: false
}
