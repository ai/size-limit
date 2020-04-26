const { existsSync } = require('fs')
let SizeLimitError = require('size-limit/size-limit-error')

let self = {
  name: '@size-limit/webpack-config',

  async step21 (config, check) {
    if (check && check.webpackConfig && check.configExtender) {
      if (!existsSync(check.configExtender)) {
        throw new SizeLimitError('noConfigExtender')
      }
      let configExtender = require(check.configExtender)
      check.webpackConfig = configExtender(check.webpackConfig)
    }
  }
}
module.exports = [self]
