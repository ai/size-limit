import { existsSync } from 'node:fs'
import { join } from 'node:path'
import open from 'open'
import { visualizer } from 'rollup-plugin-visualizer'

import { getReportName } from './report.js'

export default [
  {
    async finally(config, check) {
      let { rolldownVisualizerFile } = check

      // The build can fail after the report name was picked
      if (rolldownVisualizerFile && existsSync(rolldownVisualizerFile)) {
        await open(rolldownVisualizerFile)
      }
    },

    name: '@size-limit/rolldown-why',

    // Between config creation and the build, so a custom config is covered too
    async step30(config, check) {
      if (config.why && check.rolldownConfig && check.rolldown !== false) {
        let file = join(config.saveBundle ?? '', getReportName(config, check))
        check.rolldownVisualizerFile = file
        // A custom config is a cached module, so copy it instead of mutating.
        // Rolldown flattens nested arrays and ignores falsy plugins.
        check.rolldownConfig = {
          ...check.rolldownConfig,
          plugins: [
            check.rolldownConfig.plugins,
            visualizer({ filename: file, open: false, title: config.project })
          ]
        }
      }
    }
  }
]
