import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu(
  { type: 'lib', vue: true },
  ...harlanzw({
    base: { ignores: ['docs/**'] },
    link: true,
    nuxt: true,
    vue: true,
  }),
  {
    rules: {
      // bot matchers and robots.txt rules are built from user config at runtime
      'e18e/prefer-static-regex': 'off',
    },
  },
  {
    files: ['**/server/**/*.ts', '**/src/**/*.ts'],
    rules: {
      'harlanzw/vue-no-faux-composables': 'off',
      'harlanzw/vue-require-composable-prefix': 'off',
    },
  },
)
