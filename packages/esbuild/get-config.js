let escapeRegexp = require('escape-string-regexp')

module.exports = async function getConfig(limitConfig, check, output) {
  if (check.files.length === 0) {
    check.missed = true
    check.esbuild = false
  }

  let config = {
    entryPoints: Array.isArray(check.files) ? check.files : [check.files],
    external: check.ignore,
    outdir: output,

    write: true,
    metafile: true,

    bundle: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true
  }

  return config
}
