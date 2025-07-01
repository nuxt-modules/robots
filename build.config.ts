import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  rollup: {
    emitCJS: true,
  },
  entries: [
    { input: 'src/content', name: 'content' },
    { input: 'src/util', name: 'util' },
  ],
  externals: [
    'h3',
    'std-env',
    'nitropack',
    'consola',
    '@nuxt/content',
    'zod',
  ],
})
