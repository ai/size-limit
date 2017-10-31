'use strict'

const path = require('path')

module.exports = {
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: __dirname,
    filename: 'out.js'
  }
}
