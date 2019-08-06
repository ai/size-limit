class SizeLimitError extends Error {
  constructor (type, ...args) {
    let message
    if (type === 'noPackage') {
      message = 'Size Limit did’t find `package.json`. ' +
                'Create npm package and run Size Limit there.'
    } else if (type === 'unknownArg') {
      message = 'Uknown argument `' + args[0] + '`. ' +
                'Check command for typo and read docs.'
    } else if (type === 'webpackArg') {
      message = 'Argument `' + args[0] + '` works only with ' +
                '`@size-limit/webpack` module'
      if (args[0] === '--why') {
        message += '. You can add Bundle Analyzer to you own bundler.'
      }
    }
    super(message)
    this.sizeLimit = true
  }
}

module.exports = SizeLimitError
