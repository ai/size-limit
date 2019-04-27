class BaseReporter {
  log () {
    throw new Error('Function is not implemented')
  }

  warn () {
    throw new Error('Function is not implemented')
  }

  error () {
    throw new Error('Function is not implemented')
  }
}

module.exports = {
  BaseReporter
}
