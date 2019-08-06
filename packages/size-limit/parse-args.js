let SizeLimitError = require('./size-limit-error')

module.exports = function parseArgs (modules, argv) {
  let isWebpack = modules.some(i => i.name === '@size-limit/webpack')
  let ignore = { '--help': true, '--version': true, '--json': true }
  let args = { }
  for (let i = 2; i < argv.length; i++) {
    let arg = argv[i]
    if (arg === '--limit') {
      args.limit = argv[++i]
    } else if (arg === '--save-build') {
      args.saveBuild = argv[++i]
    } else if (arg === '--why') {
      if (!isWebpack) throw new SizeLimitError('webpackArg', '--why')
      args.why = true
    } else if (arg === '--webpack-config') {
      if (!isWebpack) throw new SizeLimitError('webpackArg', '--webpack-config')
      args.webpackConfig = argv[++i]
    } else if (!ignore[arg]) {
      throw new SizeLimitError('unknownArg', arg)
    }
  }
  return args
}
