let esbuild = require('esbuild')

module.exports = function runEsbuild(check) {
  return esbuild.build(check.esbuildConfig)
}
