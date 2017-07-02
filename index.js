'use strict'

const Analyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const MemoryFS = require('memory-fs')
const gzipSize = require('gzip-size')
const webpack = require('webpack')
const Babili = require('babili-webpack-plugin')
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

function getConfig (files, opts) {
  const config = {
    entry: files,
    output: {
      filename: 'bundle.js'
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      })
    ]
  }

  if (opts.minifier === 'babili') {
    config.plugins.push(new Babili())
  } else {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
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
    }))
  }

  if (opts.analyzer) {
    config.plugins.push(new Analyzer({
      openAnalyzer: opts.analyzer === 'server',
      analyzerMode: opts.analyzer,
      defaultSizes: 'gzip'
    }))
  }

  return config
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
 * @param {object} [opts] Extra options.
 * @param {"server"|"static"|false} [opts.analyzer] Show package content
 *                                                  in browser.
 * @param {"uglifyjs"|"babili"} [opts.minifier="uglifyjs"] Minifier.
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
 *   if (size > 1 * 1024 * 1024) {
 *     console.error('Project become bigger than 1MB')
 *   }
 * })
 */
function getSize (files, opts) {
  if (typeof files === 'string') files = [files]
  if (!opts) opts = { }

  return runWebpack(getConfig(files, opts)).then(stats => {
    if (stats.hasErrors()) {
      throw new Error(stats.toString('errors-only'))
    }

    const out = stats.compilation.outputOptions
    const file = path.join(out.path, out.filename)
    const fs = stats.compilation.compiler.outputFileSystem

    return promisify(done => fs.readFile(file, 'utf8', done))
  }).then(content => {
    return promisify(done => gzipSize(content, done))
  }).then(size => {
    return size - 293
  })
}

module.exports = getSize
