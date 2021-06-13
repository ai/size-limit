let { resolve, parse, dirname } = require('path')
let { promisify } = require('util')
let { readFile, existsSync } = require('fs')

let readFileAsync = promisify(readFile)

async function readPkg(cwd) {
  let filePath = resolve(cwd, 'package.json')
  return JSON.parse(await readFileAsync(filePath, 'utf8'))
}

async function findUp(name, cwd = '') {
  let directory = resolve(cwd)
  let { root } = parse(directory)

  while (true) {
    let foundPath = await resolve(directory, name)

    if (existsSync(foundPath)) {
      return foundPath
    }

    if (directory === root) {
      return undefined
    }

    directory = dirname(directory)
  }
}

module.exports = async cwd => {
  let filePath = await findUp('package.json', cwd)

  if (!filePath) {
    return undefined
  }

  return {
    packageJson: await readPkg(dirname(filePath)),
    path: filePath
  }
}
