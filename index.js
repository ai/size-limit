'use strict'

const MemoryFS = require('memory-fs')
const gzipSize = require('gzip-size')
const webpack = require('webpack')
const path = require('path')

function promisify (callback) {
  return new Promise((resolve, reject) => {
    callback((err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

function getConfig (files) {
  return {
    entry: files,
    output: {
      filename: 'bundle.js'
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: false,
        mangle: {
          screw_ie8: true
        },
        compress: {
          screw_ie8: true
        },
        compressor: {
          warnings: false
        },
        output: {
          comments: false
        }
      })
    ]
  }
}

function runWebpack (config) {
  return promisify(done => {
    const compiler = webpack(config)
    compiler.outputFileSystem = new MemoryFS()
    compiler.run(done)
  })
}

/**
 * Return size of project files with all dependencies and after UglifyJS
 * and gzip.
 *
 * @param {string|string[]} files Files to get size.
 *
 * @return {Promise} Promise with size of files
 *
 * @example
 * const getSize = require('size-limit')
 *
 * const index = path.join(__dirname, 'index.js')
 * const extra = path.join(__dirname, 'extra.js')
 *
 * getSize([index, extra]).then(size => {
 *   if ( > 1 * 1024 * 1024) {
 *     console.error('Project become bigger than 1MB')
 *   }
 * })
 */
function getSize (files) {
  if (typeof files === 'string') files = [files]

  return runWebpack(getConfig(files)).then(stats => {
    if (stats.hasErrors()) {
      throw new Error(stats.toString('errors-only'))
    }

    const opts = stats.compilation.outputOptions
    const file = path.join(opts.path, opts.filename)
    const fs = stats.compilation.compiler.outputFileSystem

    return promisify(done => fs.readFile(file, 'utf8', done))
  }).then(content => {
    return promisify(done => gzipSize(content, done))
  }).then(size => {
    return size - 293
  })
}

module.exports = getSize
