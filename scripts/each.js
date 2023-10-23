#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGES = join(fileURLToPath(import.meta.url), '..', '..', 'packages')

let command = process.argv[2]
let args = process.argv.slice(3)

let dirs = readdirSync(PACKAGES)

function nextTick() {
  if (dirs.length === 0) return
  let dir = dirs.pop()

  if (!existsSync(join(PACKAGES, dir, 'package.json'))) {
    nextTick()
    return
  }

  process.stdout.write(`$ cd packages/${dir}\n`)
  process.stdout.write(`$ ${command} ${args.join(' ')}\n`)
  let run = spawn(command, args, {
    cwd: join(PACKAGES, dir),
    env: process.env,
    stdio: 'inherit'
  })
  run.on('close', exitCode => {
    if (exitCode === 0) {
      nextTick()
    } else {
      process.exit(exitCode)
    }
  })
}

nextTick()
