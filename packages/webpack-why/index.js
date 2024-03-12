import StatoscopeWebpackPlugin from '@statoscope/webpack-plugin'
import { join } from 'node:path'

function addStatoscope(limitConfig, check, webpackConfig) {
  if (limitConfig.why) {
    let shouldOpen = process.env.NODE_ENV !== 'test' && !limitConfig.saveBundle

    webpackConfig.plugins.push(
      new StatoscopeWebpackPlugin.default({
        additionalStats: [limitConfig.compareWith, check.compareWith].filter(
          Boolean
        ),
        name: limitConfig.project,
        open: shouldOpen ? 'file' : false,
        reports: check.uiReports || [],
        saveReportTo: limitConfig.saveBundle
          ? join(limitConfig.saveBundle, 'report.html')
          : undefined,
        saveStatsTo: limitConfig.saveBundle
          ? join(limitConfig.saveBundle, 'stats.json')
          : undefined,
        watchMode: limitConfig.watch
      })
    )
  } else if (limitConfig.saveBundle) {
    webpackConfig.plugins.push(
      new StatoscopeWebpackPlugin.default({
        open: false,
        saveReportTo: join(limitConfig.saveBundle, 'report.html'),
        saveStatsTo: join(limitConfig.saveBundle, 'stats.json'),
        watchMode: limitConfig.watch
      })
    )
  }
}

export default [
  {
    async before(config, check) {
      let modifyConfig = check.modifyWebpackConfig

      check.modifyWebpackConfig = function modifyWebpackConfig(webpackConfig) {
        addStatoscope(config, check, webpackConfig)

        if (modifyConfig) {
          return modifyConfig(webpackConfig) || webpackConfig
        }

        return webpackConfig
      }
    },

    name: '@size-limit/webpack-why'
  }
]
