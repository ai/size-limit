import processImport from 'size-limit/process-import'

export default async function getConfig(limitConfig, check, output) {
  await processImport(check, output)

  let config = {
    allowOverwrite: !!check.import,
    bundle: true,
    entryPoints: Array.isArray(check.files) ? check.files : [check.files],

    external: check.ignore,
    metafile: true,
    minifyIdentifiers: true,

    minifySyntax: true,
    minifyWhitespace: true,
    outdir: output,
    treeShaking: true,
    write: true
  }

  return config
}
