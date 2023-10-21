import esbuild from 'esbuild'

export function runEsbuild(check) {
  return esbuild.build(check.esbuildConfig)
}
