let { writeFile } = require('fs').promises
let { join } = require('path')
let mkdirp = require('mkdirp')

module.exports = async function getConfig(limitConfig, check, output) {
  if (check.import) {
    let loader = ''
    for (let i in check.import) {
      let list = check.import[i].replace(/}|{/g, '').trim()
      loader +=
        `import ${check.import[i]} from ${JSON.stringify(i)}\n` +
        `console.log(${list})\n`
    }
    await mkdirp(output)
    let entry = join(output, 'index.js')
    await writeFile(entry, loader)
    check.files = entry
  }

  let config = {
    entryPoints: Array.isArray(check.files) ? check.files : [check.files],
    external: check.ignore,
    outdir: output,

    write: true,
    metafile: true,
    treeShaking: true,

    bundle: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true
  }

  return config
}
