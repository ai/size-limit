import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, parse, resolve } from 'node:path'

async function readPkg(cwd) {
  let filePath = resolve(cwd, 'package.json')
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function findUp(name, cwd = '') {
  let directory = resolve(cwd)
  let { root } = parse(directory)

  while (true) {
    let foundPath = resolve(directory, name)

    if (existsSync(foundPath)) {
      return foundPath
    }

    if (directory === root) {
      return undefined
    }

    directory = dirname(directory)
  }
}

export default async cwd => {
  let filePath = await findUp('package.json', cwd)

  if (!filePath) {
    return undefined
  }

  return {
    packageJson: await readPkg(dirname(filePath)),
    path: filePath
  }
}
