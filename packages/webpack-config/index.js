const { existsSync } = require('fs')

function webpackConfig ({ extenderPath } = {}) {
  if (!existsSync(extenderPath)) {
    // @TODO Cast SizeLimitError error and add proper error message
    throw new Error(
      'extenderPath option must point to an existing file'
    )
  }

  let self = {
    name: '@size-limit/webpack-config',

    async step21 (config, check) {
      if (check === false) return
      if (check.webpackConfig) {
        let configExtender = require(extenderPath)
        check.webpackConfig = configExtender(check.webpackConfig)
      }
    }
  }

  return [self]
}

module.exports = webpackConfig
