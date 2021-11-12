const path = require('path')

module.exports = {
  entryPoints: [
    path.join(__dirname, 'file.js'),
    path.join(__dirname, 'small.js')
  ],
  outdir: 'custom',
  bundle: true,
  minify: false
}
