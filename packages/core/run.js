let ownPackage = require('./package.json')

module.exports = process => {
  if (process.argv[2] === '--version') {
    process.stdout.write(ownPackage.version + '\n')
  }
}
