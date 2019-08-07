let SizeLimitError = require('./size-limit-error')

module.exports = function parseArgs (modules, argv) {
  let isWebpack = modules.some(i => i.name === '@size-limit/webpack')
  let args = { files: [] }
  for (let i = 2; i < argv.length; i++) {
    let arg = argv[i]
    if (arg === '--limit') {
      args.limit = argv[++i]
    } else if (arg === '--save-build') {
      args.saveBuild = argv[++i]
    } else if (arg === '--why') {
      if (!isWebpack) throw new SizeLimitError('whyWithoutWebpack')
      args.why = true
    } else if (arg[0] !== '-') {
      args.files.push(arg)
    } else {
      throw new SizeLimitError('unknownArg', arg)
    }
  }
  return args
}
