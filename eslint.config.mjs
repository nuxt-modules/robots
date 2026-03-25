import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu(
  {
    type: 'lib',
    ignores: [
      'CLAUDE.md',
      'test/fixtures/**',
      'playground/**',
      'docs/**',
    ],
    rules: {
      'no-use-before-define': 'off',
      'node/prefer-global/process': 'off',
      'node/prefer-global/buffer': 'off',
      'ts/explicit-function-return-type': 'off',
      'e18e/prefer-static-regex': 'off',
    },
  },
  {
    files: ['**/test/**/*.ts', '**/test/**/*.js'],
    rules: {
      'ts/no-unsafe-function-type': 'off',
      'no-console': 'off',
      'antfu/no-top-level-await': 'off',
    },
  },
  ...harlanzw({ link: true, nuxt: true, vue: true }),
  {
    files: ['**/server/**/*.ts', '**/src/**/*.ts'],
    rules: {
      'harlanzw/vue-no-faux-composables': 'off',
      'harlanzw/vue-require-composable-prefix': 'off',
    },
  },
  {
    files: ['examples/**/package.json'],
    rules: {
      'pnpm/json-enforce-catalog': 'off',
      'pnpm/json-valid-catalog': 'off',
      'pnpm/json-prefer-workspace-settings': 'off',
    },
  },
)
