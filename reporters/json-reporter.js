function print (data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

module.exports = {
  error (msg) {
    print({ error: msg })
  },

  results (results) {
    print(results.map(result => {
      let out = {
        name: result.file.name,
        passed: !result.failed,
        size: result.file.size,
        loading: result.file.loading
      }
      if (typeof result.file.running === 'number') {
        out.running = result.file.running
      }
      return out
    }))
  }
}
