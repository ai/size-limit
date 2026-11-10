import { registerHooks } from 'node:module'
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

let counter = 0

// `import.meta.resolve(name, parent)` still needs a Node.js flag, so redirect
// the parent with a one-shot sync hook. Unlike `createRequire().resolve()`,
// this keeps ESM `import` conditions and Yarn PnP.
function resolveFrom(name, pkgPath) {
  let marker = `size-limit-plugin:${counter++}`
  let parentURL = pathToFileURL(pkgPath).href
  let hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier !== marker) return nextResolve(specifier, context)
      return nextResolve(name, { ...context, parentURL })
    }
  })
  try {
    return import.meta.resolve(marker)
  } finally {
    hooks.deregister()
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
    let url
    try {
      url = resolveFrom(name, pkgPath)
    } catch {
      throw error
    }
    let module = await import(url)
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
