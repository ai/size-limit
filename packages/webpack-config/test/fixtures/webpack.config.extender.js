const { writeFileSync } = require('fs')
const { join } = require('path')

class WebpackSaveStatsToFile {
  apply (compiler) {
    compiler.hooks.done.tap('Webpack extended plugin', stats => {
      writeFileSync(
        join(__dirname, 'stats.temp'),
        stats
      )
    })
  }
}

module.exports = config => {
  if (!config.plugins) {
    config.plugins = []
  }
  config.plugins.push(new WebpackSaveStatsToFile())
  return config
}
