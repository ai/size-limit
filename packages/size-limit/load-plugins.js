function toArray(obj) {
  return typeof obj === 'object' ? Object.keys(obj) : []
}

class Plugins {
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

async function loadPlugins(pkg) {
  if (!pkg || !pkg.packageJson) return new Plugins([])

  let promises = toArray(pkg.packageJson.dependencies)
    .concat(toArray(pkg.packageJson.devDependencies))
    .concat(toArray(pkg.packageJson.optionalDependencies))
    .filter(i => i.startsWith('@size-limit/') || i.startsWith('size-limit-'))
    .map(async name => (await import(name)).default)

  let list = (await Promise.all(promises)).flat()

  return new Plugins(list)
}

export default loadPlugins
export { Plugins }
