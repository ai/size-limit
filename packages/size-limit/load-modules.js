function list (obj) {
  return typeof obj === 'object' ? Object.keys(obj) : []
}

module.exports = function loadModules (pkg) {
  if (!pkg || !pkg.package) return []
  return list(pkg.package.dependencies)
    .concat(list(pkg.package.devDependencies))
    .filter(i => i.startsWith('@size-limit/'))
    .reduce((modules, i) => modules.concat(require(i)), [])
}
