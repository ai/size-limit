import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 100
      },
      reporter: ['text', 'lcov'],
      skipFull: true,
      clean: true,
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/fixtures',
        '**/scripts',
        '**/test',
        'packages/size-limit/bin.js',
        'packages/preset-app/index.js'
      ]
    },
    testTimeout: 20_000,
    retry: process.env.CI ? 1 : 0,
    fileParallelism: !process.env.CI
  },
  server: { watch: { ignored: ['**/fixtures', '**/dist', '**/out'] } }
})
