import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

function toArray(obj) {
  return typeof obj === 'object' ? Object.keys(obj) : []
}

export class Plugins {
  constructor(list) {
    this.list = list
    this.isEmpty = list.length === 0
  }

  has(type) {
    return this.list.some(
      i => i.name === `@size-limit/${type}` || i.name === `size-limit-${type}`
    )
  }
}

const NOT_FOUND = new Set(['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND'])

async function importPlugin(name, pkgPath) {
  try {
    let module = await import(name)
    return module.default
  } catch (error) {
    // Strict installs (pnpm without hoisting, Yarn PnP) hide packages that
    // Size Limit does not depend on, so look where the plugin is declared.
    // Yarn PnP reports the CommonJS code even for import().
    if (!NOT_FOUND.has(error.code)) throw error
    let file
    try {
      file = createRequire(pkgPath).resolve(name)
    } catch {
      throw error
    }
    let module = await import(pathToFileURL(file).href)
    return module.default
  }
}

export default async function loadPlugins(pkg) {
  if (!pkg || !pkg.packageJson) return new Plugins([])

  let list = await Promise.all(
    toArray(pkg.packageJson.dependencies)
      .concat(toArray(pkg.packageJson.devDependencies))
      .concat(toArray(pkg.packageJson.optionalDependencies))
      .filter(i => i.startsWith('@size-limit/') || i.startsWith('size-limit-'))
      .map(i => importPlugin(i, pkg.path))
  ).then(arr => arr.flat())

  return new Plugins(list)
}
