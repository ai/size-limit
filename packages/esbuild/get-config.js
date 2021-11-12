module.exports = async function getConfig(limitConfig, check, output) {
  if (check.files.length === 0) {
    check.missed = true
    check.esbuild = false
  }

  let config = {
    entryPoints: check.files,
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
