let processImport = require('size-limit/process-import')

module.exports = async function getConfig(limitConfig, check, output) {
  await processImport(check, output)

  let config = {
    entryPoints: Array.isArray(check.files) ? check.files : [check.files],
    external: check.ignore,
    outdir: output,

    write: true,
    metafile: true,
    treeShaking: true,

    allowOverwrite: !!check.import,
    bundle: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true
  }

  return config
}
