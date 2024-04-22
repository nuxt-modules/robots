// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true,
  },
  dirs: {
    src: [
      './playground',
      './test/fixture/config-file',
      './test/fixture/empty',
      './test/fixture/generate',
      './test/fixture/warn',
    ],
  },
})
