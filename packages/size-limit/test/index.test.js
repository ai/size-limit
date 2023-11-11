import esbuildPlugin from '@size-limit/esbuild'
import filePlugin from '@size-limit/file'
import webpackPlugin from '@size-limit/webpack'
import { join } from 'node:path'
import { expect, it } from 'vitest'

import sizeLimit from '../index.js'

const ROOT = join(__dirname, '..', '..', '..')
const INTEGRATION = join(ROOT, 'fixtures', 'integration', 'index.js')

it('has JS API', async () => {
  let result = await sizeLimit([webpackPlugin, filePlugin], [INTEGRATION])
  expect(result).toEqual([{ size: 123 }])
})

it('works with file module only', async () => {
  let result = await sizeLimit([filePlugin], [INTEGRATION])
  expect(result).toEqual([{ size: 21 }])
})

it('works with esbuild module', async () => {
  let result = await sizeLimit([esbuildPlugin, filePlugin], [INTEGRATION])
  expect(result).toEqual([{ size: expect.anything() }])
  expect(result[0].size).toBeCloseTo(90, -2)
})
