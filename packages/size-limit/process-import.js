import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function processImport(check, output) {
  if (!check.import) {
    return
  }

  let loader = ''
  for (let i in check.import) {
    let imports = `${check.import[i]}`
    let list = check.import[i].replace(/}|{/g, '').trim()

    if (check.import[i] === '*') {
      imports = `${check.import[i]} as all`
      list = `all`
    }

    loader +=
      `import ${imports} from ${JSON.stringify(i)}\n` + `console.log(${list})\n`
  }
  await mkdir(output, { recursive: true })
  let entry = join(output, 'index.js')
  await writeFile(entry, loader)
  check.files = entry
}
