#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGES = join(fileURLToPath(import.meta.url), '..', '..', 'packages')

let version = process.argv[2]
if (!version) {
  console.error('Pass version')
  process.exit(1)
}

for (let dir of readdirSync(PACKAGES)) {
  let pkgPath = join(PACKAGES, dir, 'package.json')
  if (existsSync(pkgPath)) {
    let pkg = readFileSync(pkgPath).toString()
    // Dependencies between packages use `workspace:*`,
    // which pnpm replaces with the real version on publish
    writeFileSync(
      pkgPath,
      pkg.replace(/("version": )"\d+.\d+.\d+"/g, `$1"${version}"`)
    )
  }
}
