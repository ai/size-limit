let { visualizer } = require('esbuild-visualizer')
let { join } = require('path')
let { writeFileSync } = require('fs')

let { getReportName } = require('./report')

let self = {
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
