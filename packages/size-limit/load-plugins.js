function toArray (obj) {
  return typeof obj === 'object' ? Object.keys(obj) : []
}

module.exports = function loadPlugins (pkg) {
  if (!pkg || !pkg.packageJson) return []

  let list = toArray(pkg.packageJson.dependencies)
    .concat(toArray(pkg.packageJson.devDependencies))
    .filter(i => i.startsWith('@size-limit/'))
    .reduce((all, i) => all.concat(require(require.resolve(i, {
      paths: [process.cwd()]
    }))), [])

  return {
    list,
    isEmpty: list.length === 0,
    has (type) {
      return this.list.some(i => i.name === `@size-limit/${ type }`)
    }
  }
}
