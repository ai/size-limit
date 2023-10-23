import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      lines: 100,
      reporter: ['text', 'lcov'],
      skipFull: true,
      clean: true
    },
    watchExclude: ['**/fixtures', '**/dist', '**/out']
  }
})
