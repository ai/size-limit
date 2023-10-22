import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      statements: 100,
    },
    watchExclude: [
      '**/fixtures',
      '**/dist',
      '**/out',
    ],
  },
})
