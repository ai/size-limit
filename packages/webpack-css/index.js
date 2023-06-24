let CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

const cssRule = {
  exclude: /\.module\.css$/,
  test: /\.css$/,
  use: [require.resolve('style-loader'), require.resolve('css-loader')]
}

const moduleCssRule = {
  test: /\.module\.css$/,
  use: [
    require.resolve('style-loader'),
    {
      loader: require.resolve('css-loader'),
      options: {
        modules: true
      }
    }
  ]
}

function addCssSupport(webpackConfig) {
  webpackConfig.module.rules.push(cssRule, moduleCssRule)
  webpackConfig.optimization.minimizer = (
    webpackConfig.optimization.minimizer || []
  ).concat(['...', new CssMinimizerPlugin()])
}

let self = {
  async before(config, check) {
    let modifyConfig = check.modifyWebpackConfig

    check.modifyWebpackConfig = function modifyWebpackConfig(webpackConfig) {
      addCssSupport(webpackConfig)

      if (modifyConfig) {
        return modifyConfig(webpackConfig) || webpackConfig
      }

      return webpackConfig
    }
  },

  name: '@size-limit/webpack-css'
}

module.exports = [self]
