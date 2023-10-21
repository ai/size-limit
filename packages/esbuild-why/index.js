import { visualizer } from 'esbuild-visualizer'
import { writeFileSync } from 'fs'
import open from 'open'
import { join } from 'path'

import { getReportName } from './report'

export default [{
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
}]
