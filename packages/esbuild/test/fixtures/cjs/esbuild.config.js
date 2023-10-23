const { join } = require('path')

module.exports = {
  entryPoints: [join(__dirname, 'file.js'), join(__dirname, 'small.js')],
  outdir: join(process.cwd(), 'dist'),
  bundle: true,
  minify: false
}
