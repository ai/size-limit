import file from '@size-limit/file'
import time from '@size-limit/time'
import webpack from '@size-limit/webpack'

export default [...webpack, ...file, ...time]
