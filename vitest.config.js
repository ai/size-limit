import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Tests run real bundlers and headless Chrome, which are slow
    // when all test files run in parallel on busy CI runners
    testTimeout: 60_000,
    server: {
      deps: {
        // Size Limit configs must be loaded by Node.js, not by Vite,
        // to test the real `import()` of TypeScript configs
        external: [/\/fixtures\/.*\/\.size-limit\.[cm]?[jt]s$/]
      }
    }
  }
})
