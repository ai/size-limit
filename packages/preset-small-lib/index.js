import esbuildPlugins from '@size-limit/esbuild'
import filePlugins from '@size-limit/file'

let [esbuild] = esbuildPlugins
let [file] = filePlugins

export default [esbuild, file]
