import esbuild from 'esbuild'

module.exports = function runEsbuild(check) {
  return esbuild.build(check.esbuildConfig)
}
