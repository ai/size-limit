const path = require('path')
const { promisify } = require('util')
const fs = require('fs')

const readFileAsync = promisify(fs.readFile)

const readPkg = async cwd => {
  let filePath = path.resolve(cwd, 'package.json')
  return JSON.parse(await readFileAsync(filePath, 'utf8'))
}

const findUp = async (name, cwd = '') => {
  let directory = path.resolve(cwd)
  let { root } = path.parse(directory)

  while (true) {
    let foundPath = await path.resolve(directory, name)

    if (fs.existsSync(foundPath)) {
      return foundPath
    }

    if (directory === root) {
      return undefined
    }

    directory = path.dirname(directory)
  }
}

module.exports = async cwd => {
  let filePath = await findUp('package.json', cwd)

  if (!filePath) {
    return undefined
  }

  return {
    packageJson: await readPkg(path.dirname(filePath)),
    path: filePath
  }
}
