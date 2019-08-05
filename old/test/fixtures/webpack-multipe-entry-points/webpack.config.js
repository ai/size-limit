const path = require('path')

module.exports = {
  entry: {
    moduleA: path.join(__dirname, 'moduleA.js'),
    moduleB: path.join(__dirname, 'moduleB.js'),
    moduleC: path.join(__dirname, 'moduleC.js')
  },
  output: {
    filename: '[name]-[hash].js'
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: true
  },
  mode: 'development'
}
