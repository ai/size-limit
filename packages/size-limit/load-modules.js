function list (obj) {
  return typeof obj === 'object' ? Object.keys(obj) : []
}

module.exports = function loadModules (pkg) {
  if (!pkg || !pkg.package) return []

  let modules = list(pkg.package.dependencies)
    .concat(list(pkg.package.devDependencies))
    .filter(i => i.startsWith('@size-limit/'))
    .reduce((all, i) => all.concat(require(i)), [])

  return {
    modules,
    isEmpty: modules.length === 0,
    has (type) {
      return this.modules.some(i => i.name === `@size-limit/${ type }`)
    }
  }
}
