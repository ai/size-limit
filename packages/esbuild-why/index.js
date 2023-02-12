const { visualizer } = require('esbuild-visualizer')
const { join } = require('path')
const { writeFileSync } = require('fs')

const { getReportName } = require('./report')

const self = {
  name: '@size-limit/esbuild-why',

  async step81(config, check) {
    if (config.why && check.esbuildMetafile) {
      let result = await visualizer(check.esbuildMetafile)
      let file = join(config.saveBundle ?? '', getReportName(config, check))
      writeFileSync(file, result)
    }
  }
}

module.exports = [self]
