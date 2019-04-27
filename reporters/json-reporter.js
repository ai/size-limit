function print (data) {
  process.stdout.write(`${ JSON.stringify(data, null, 2) }\n`)
}

module.exports = {
  error (msg) {
    print({ error: msg })
  },

  results (results) {
    print(results.map(result => ({
      name: result.file.name,
      passed: !result.failed,
      size: result.file.size,
      loading: result.file.loading,
      running: result.file.running
    })))
  }
}
