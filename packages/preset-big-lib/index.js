import filePlugins from '@size-limit/file'
import timePlugins from '@size-limit/time'
import webpackPlugins from '@size-limit/webpack'

let [webpack] = webpackPlugins
let [file] = filePlugins
let [time] = timePlugins

export default [webpack, file, time]
