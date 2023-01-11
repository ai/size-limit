let processImport = require('size-limit/process-import')

function escapeRegexp(string) {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
}

const STATIC =
  /\.(eot|woff2?|ttf|otf|svg|png|jpe?g|gif|webp|mp4|mp3|ogg|pdf|html|ico|md)$/

module.exports = async function getConfig(limitConfig, check, output) {
  await processImport(check, output)

  if (check.files.length === 0) {
    check.missed = true
    check.webpack = false
  }

  let config = {
    entry: {
      index: check.files
    },
    output: {
      filename: limitConfig.why && `${limitConfig.project}.js`,
      path: output
    },
    optimization: {
      concatenateModules: !check.disableModuleConcatenation
    },
    module: {
      rules: [
        {
          test: STATIC,
          type: 'asset/resource'
        }
      ]
    }
  }

  if (check.ignore && check.ignore.length > 0) {
    let escaped = check.ignore.map(i => escapeRegexp(i))
    let ignorePattern = new RegExp(`^(${escaped.join('|')})($|/)`)
    config.externals = ({ request }, callback) => {
      if (ignorePattern.test(request)) {
        callback(null, 'root a')
      } else {
        callback()
      }
    }
  }

  if (!config.plugins) config.plugins = []

  return config
}
