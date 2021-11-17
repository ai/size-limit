let StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default
let { join } = require('path')

function addStatoscope(limitConfig, check, webpackConfig) {
  if (limitConfig.why) {
    let shouldOpen = process.env.NODE_ENV !== 'test' && !limitConfig.saveBundle

    webpackConfig.plugins.push(
      new StatoscopeWebpackPlugin({
        saveReportTo: limitConfig.saveBundle
          ? join(limitConfig.saveBundle, 'report.html')
          : undefined,
        saveStatsTo: limitConfig.saveBundle
          ? join(limitConfig.saveBundle, 'stats.json')
          : undefined,
        additionalStats: [limitConfig.compareWith, check.compareWith].filter(
          Boolean
        ),
        open: shouldOpen ? 'file' : false,
        name: limitConfig.project,
        watchMode: limitConfig.watch,
        reports: check.uiReports || []
      })
    )
  } else if (limitConfig.saveBundle) {
    webpackConfig.plugins.push(
      new StatoscopeWebpackPlugin({
        saveReportTo: join(limitConfig.saveBundle, 'report.html'),
        saveStatsTo: join(limitConfig.saveBundle, 'stats.json'),
        open: false,
        watchMode: limitConfig.watch
      })
    )
  }
}

let self = {
  name: '@size-limit/webpack-why',

  async before(config, check) {
    let modifyConfig = check.modifyWebpackConfig

    check.modifyWebpackConfig = function modifyWebpackConfig(webpackConfig) {
      addStatoscope(config, check, webpackConfig)

      if (modifyConfig) {
        return modifyConfig(webpackConfig) || webpackConfig
      }

      return webpackConfig
    }
  }
}

module.exports = [self]
