let { writeFile } = require('fs').promises
let { join } = require('path')
let mkdirp = require('mkdirp')

module.exports = async function processImport(check, output) {
  if (!check.import) {
    return
  }

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
