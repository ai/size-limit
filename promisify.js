module.exports = function promisify (callback) {
  return new Promise((resolve, reject) => {
    callback((err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}
