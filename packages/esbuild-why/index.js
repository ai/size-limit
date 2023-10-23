import { visualizer } from 'esbuild-visualizer'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import open from 'open'

import { getReportName } from './report.js'

export default [
  {
    async finally(config, check) {
      let { esbuildVisualizerFile } = check

      if (esbuildVisualizerFile) {
        await open(esbuildVisualizerFile)
      }
    },

    name: '@size-limit/esbuild-why',
    async step81(config, check) {
      if (config.why && check.esbuildMetafile) {
        let result = await visualizer(check.esbuildMetafile)
        let file = join(config.saveBundle ?? '', getReportName(config, check))
        check.esbuildVisualizerFile = file
        writeFileSync(file, result)
      }
    }
  }
]
