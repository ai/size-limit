let { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
let escapeRegexp = require('escape-string-regexp')
let OptimizeCss = require('optimize-css-assets-webpack-plugin')
let PnpWebpackPlugin = require('pnp-webpack-plugin')
let mkdirp = require('mkdirp')
let path = require('path')
let fs = require('fs')

const STATIC =
  /\.(eot|woff2?|ttf|otf|svg|png|jpe?g|gif|webp|mp4|mp3|ogg|pdf|html|ico|md)$/

module.exports = function getConfig (limitConfig, check, output) {
  if (check.import) {
    let file = path.join(output, 'entry.js')
    let source = path.resolve(check.path)
    mkdirp.sync(output)
    fs.writeFileSync(file,
      `import { ${ check.import } } from '${ source }'\n` +
      `console.log(${ check.import })\n`
    )
    check.path = file
  }

  let config = {
    entry: {
      index: check.path
    },
    output: {
      filename: limitConfig.why && `${ limitConfig.project }.js`,
      path: output
    },
    optimization: {
      concatenateModules: !check.disableModuleConcatenation
    },
    resolve: {
      plugins: [
        PnpWebpackPlugin
      ]
    },
    resolveLoader: {
      plugins: [
        PnpWebpackPlugin.moduleLoader(module)
      ]
    },
    module: {
      rules: [
        {
          test: STATIC,
          use: 'file-loader'
        },
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.module\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new OptimizeCss()
    ]
  }

  if (check.ignore && check.ignore.length > 0) {
    let escaped = check.ignore.map(i => escapeRegexp(i))
    let ignorePattern = new RegExp(`^(${ escaped.join('|') })($|/)`)
    config.externals = (context, request, callback) => {
      if (ignorePattern.test(request)) {
        callback(null, 'root a')
      } else {
        callback()
      }
    }
  }

  if (limitConfig.why) {
    config.plugins.push(new BundleAnalyzerPlugin({
      openAnalyzer: process.env.NODE_ENV !== 'test',
      analyzerMode: process.env.NODE_ENV === 'test' ? 'static' : 'server',
      defaultSizes: check.gzip === false ? 'parsed' : 'gzip',
      analyzerPort: 8888 + limitConfig.checks.findIndex(i => i === check)
    }))
  }

  return config
}
