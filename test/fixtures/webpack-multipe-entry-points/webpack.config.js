const path = require('path')

module.exports = {
  entry: {
    moduleA: path.join(__dirname, 'moduleA.js'),
    moduleB: path.join(__dirname, 'moduleB.js')
  },
  output: {
    filename: '[name].js'
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: true
  },
  mode: 'development'
}
