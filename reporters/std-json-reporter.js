const { StdReporter } = require('./std-reporter')

class StdJsonReporter extends StdReporter {
  format ({ message }) {
    return JSON.stringify(message, null, 2)
  }

  logResults ({ results }) {
    let output = results.map(result => ({
      name: result.file.name,
      passed: !result.failed,
      size: result.file.size,
      loading: result.file.loading,
      running: result.file.running
    }))
    super.log({
      message: this.format({ message: output })
    })
  }

  error ({ message }) {
    super.error({
      message: this.format({ message: { error: message } })
    })
  }
}

module.exports = {
  StdJsonReporter
}
