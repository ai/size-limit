function toArray (obj) {
  return typeof obj === 'object' ? Object.keys(obj) : []
}

class Plugins {
  constructor (list) {
    this.list = list
    this.isEmpty = list.length === 0
  }

  has (type) {
    return this.list.some(i => i.name === `@size-limit/${type}`)
  }
}

module.exports = function loadPlugins (pkg) {
  if (!pkg || !pkg.packageJson) return []

  let list = toArray(pkg.packageJson.dependencies)
    .concat(toArray(pkg.packageJson.devDependencies))
    .filter(i => i.startsWith('@size-limit/'))
    .reduce(
      (all, i) =>
        all.concat(
          require(require.resolve(i, {
            paths: [process.cwd()]
          }))
        ),
      []
    )

  return new Plugins(list)
}

module.exports.Plugins = Plugins
