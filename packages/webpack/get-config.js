let StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default
let PnpWebpackPlugin = require('pnp-webpack-plugin')
let { promisify } = require('util')
let escapeRegexp = require('escape-string-regexp')
let OptimizeCss = require('optimize-css-assets-webpack-plugin')
let { join } = require('path')
let mkdirp = require('mkdirp')
let fs = require('fs')

let writeFile = promisify(fs.writeFile)

const STATIC = /\.(eot|woff2?|ttf|otf|svg|png|jpe?g|gif|webp|mp4|mp3|ogg|pdf|html|ico|md)$/

module.exports = async function getConfig(limitConfig, check, output) {
  if (check.import) {
    let loader = ''
    for (let i in check.import) {
      let list = check.import[i].replace(/}|{/g, '').trim()
      loader +=
        `import ${check.import[i]} from ${JSON.stringify(i)}\n` +
        `console.log(${list})\n`
    }
    await mkdirp(output)
    let entry = join(output, 'entry.js')
    await writeFile(entry, loader)
    check.files = entry
  }

  let config = {
    entry: {
      index: check.files
    },
    output: {
      filename: limitConfig.why && `${limitConfig.project}.js`,
      path: output
    },
    optimization: {
      concatenateModules: !check.disableModuleConcatenation
    },
    resolve: {
      plugins: [PnpWebpackPlugin]
    },
    resolveLoader: {
      plugins: [PnpWebpackPlugin.moduleLoader(module)]
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
    plugins: [new OptimizeCss()]
  }

  if (check.ignore && check.ignore.length > 0) {
    let escaped = check.ignore.map(i => escapeRegexp(i))
    let ignorePattern = new RegExp(`^(${escaped.join('|')})($|/)`)
    config.externals = (context, request, callback) => {
      if (ignorePattern.test(request)) {
        callback(null, 'root a')
      } else {
        callback()
      }
    }
  }

  if (limitConfig.why) {
    let shouldOpen = process.env.NODE_ENV !== 'test' && !limitConfig.saveBundle
    config.plugins.push(
      new StatoscopeWebpackPlugin({
        saveStatsTo: limitConfig.saveBundle
          ? join(output, 'stats.json')
          : undefined,
        additionalStats: [limitConfig.otherStats, check.otherStats].filter(
          Boolean
        ),
        open: shouldOpen ? 'file' : false,
        name: limitConfig.project,
        watchMode: limitConfig.watch,
        reports: check.uiReports || []
      })
    )
  } else if (limitConfig.saveBundle) {
    config.plugins.push(
      new StatoscopeWebpackPlugin({
        saveStatsTo: join(output, 'stats.json'),
        saveOnlyStats: true,
        open: false,
        watchMode: limitConfig.watch
      })
    )
  }

  return config
}
