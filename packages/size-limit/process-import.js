import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function processImport(check, output) {
  if (!check.import) {
    return
  }

  let loader = ''
  let namespace = 'all'
  let importNames = Object.values(check.import).join(' ')
  for (let i in check.import) {
    let imports = `${check.import[i]}`
    let list = check.import[i].replace(/}|{/g, '').trim()

    if (check.import[i] === '*') {
      while (importNames.includes(namespace)) namespace += '_'
      imports = `* as ${namespace}`
      list = namespace
      namespace += '_'
    }

    loader += `import ${imports} from ${JSON.stringify(i)}\nconsole.log(${list})\n`
  }
  await mkdir(output, { recursive: true })
  let entry = join(output, 'index.js')
  await writeFile(entry, loader)
  check.files = entry
}
