#!/usr/bin/env node

// Resolve the `workspace:*` protocol in every package's `package.json`
// without `pnpm install`, so that no third-party code is ever downloaded
// next to the files we are about to publish.
//
// `pnpm` can not be used here: it installs the workspace to resolve the
// `workspace:*` protocol. We resolve it ourselves, rewriting each
// `package.json` in place, which only needs Node.js. The actual publishing
// is done by `npm stage publish` from inside each package directory.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const PACKAGES = join(ROOT, 'packages')
const DEPENDENCIES = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies'
]

let dirs = readdirSync(PACKAGES)
  .map(name => join(PACKAGES, name))
  .filter(dir => existsSync(join(dir, 'package.json')))

let pkgs = dirs.map(dir => JSON.parse(readFileSync(join(dir, 'package.json'))))
let versions = new Map(pkgs.map(pkg => [pkg.name, pkg.version]))

function resolveWorkspace(name, range) {
  let version = versions.get(name)
  if (!version) throw new Error(`Unknown workspace dependency ${name}`)
  if (range === '*') return version
  if (range === '^' || range === '~') return range + version
  return range
}

for (let [i, pkg] of pkgs.entries()) {
  delete pkg.devDependencies
  for (let type of DEPENDENCIES) {
    for (let [name, range] of Object.entries(pkg[type] ?? {})) {
      if (range.startsWith('workspace:')) {
        pkg[type][name] = resolveWorkspace(name, range.slice(10))
      }
    }
  }
  writeFileSync(
    join(dirs[i], 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n'
  )
}
