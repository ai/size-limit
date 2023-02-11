const { visualizer } = require('esbuild-visualizer')
const { join } = require('path')
const { writeFileSync } = require('fs')

const self = {
  name: '@size-limit/esbuild-why',

  async step81(config, check) {
    if (config.why && check.esbuildMetafile) {
      const result = await visualizer(check.esbuildMetafile)
      const file = join(config.saveBundle ?? '', 'report.html')
      writeFileSync(file, result)
    }
  }

}

module.exports = [self]
