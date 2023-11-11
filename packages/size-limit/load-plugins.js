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

export default async function loadPlugins(pkg) {
  if (!pkg || !pkg.packageJson) return new Plugins([])

  let list = await Promise.all(
    toArray(pkg.packageJson.dependencies)
      .concat(toArray(pkg.packageJson.devDependencies))
      .concat(toArray(pkg.packageJson.optionalDependencies))
      .filter(i => i.startsWith('@size-limit/') || i.startsWith('size-limit-'))
      .map(i => import(i).then(module => module.default))
  ).then(arr => arr.flat())

  return new Plugins(list)
}
