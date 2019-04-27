module.exports = {
  log (msg) {
    process.stdout.write(`\n${ this.format(msg) }\n`)
  },

  warn (msg) {
    process.stdout.write(`\n${ this.format({ warning: msg }) }\n`)
  },

  error (msg) {
    process.stderr.write(`\n${ this.format({ error: msg }) }\n`)
  },

  format (msg) {
    return JSON.stringify(msg, null, 2)
  },

  logResults (results) {
    this.log(results.map(result => ({
      name: result.file.name,
      passed: !result.failed,
      size: result.file.size,
      loading: result.file.loading,
      running: result.file.running
    })))
  }
}
