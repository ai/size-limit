let { visualizer } = require('esbuild-visualizer')
let { join } = require('path')
let { writeFileSync } = require('fs')
let open = require('open')

let { getReportName } = require('./report')

let self = {
  async finally(config, check) {
    let {esbuildVisualizerFile} = check

    if (esbuildVisualizerFile) {
      await open(esbuildVisualizerFile)
    }
  },

  name: '@size-limit/esbuild-why',
  async step81(config, check) {
    if (config.why && check.esbuildMetafile) {
      let result = await visualizer(check.esbuildMetafile)
      let file = join(config.saveBundle ?? '', getReportName(config, check))
      check.esbuildVisualizerFile = file;
      writeFileSync(file, result)
    }
  }
}

module.exports = [self]
