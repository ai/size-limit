import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    server: {
      deps: {
        // Size Limit configs must be loaded by Node.js, not by Vite,
        // to test the real `import()` of TypeScript configs
        external: [/\/fixtures\/.*\/\.size-limit\.[cm]?[jt]s$/]
      }
    }
  }
})
