import { processImport } from 'size-limit'

function escapeRegexp(string) {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
}

export async function getConfig(_limitConfig, check, output) {
  await processImport(check, output)

  if (check.files.length === 0) {
    check.missed = true
    check.rolldown = false
  }

  let config = {
    input: Array.isArray(check.files) ? check.files : [check.files],
    // Rolldown only warns on an unresolved import and drops the dependency,
    // so the size would be too small. Webpack and esbuild fail instead.
    onLog(_level, log) {
      if (log.code === 'UNRESOLVED_IMPORT') {
        let name = JSON.stringify(log.exporter)
        throw new Error(`Could not resolve ${name} in ${log.id}`)
      }
    },
    output: {
      comments: { annotation: false },
      dir: output,
      minify: true
    },
    treeshake: true,
    write: true
  }

  if (check.ignore && check.ignore.length > 0) {
    // A plain string would not cover `redux/lib/redux` for `redux`
    let escaped = check.ignore.map(i => escapeRegexp(i))
    config.external = new RegExp(`^(${escaped.join('|')})($|/)`)
  }

  return config
}
