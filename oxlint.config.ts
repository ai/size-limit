import loguxOxlintConfig from '@logux/oxc-configs/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [loguxOxlintConfig],
  rules: {
    'typescript/unbound-method': 'off',
    'unicorn/consistent-function-scoping': 'off',
    'no-console': 'off',
    'no-control-regex': 'off',
    'typescript/no-floating-promises': 'off'
  },
  ignorePatterns: ['fixtures/', 'packages/*/test/fixtures/']
})
