import { writeFile } from 'node:fs/promises'
import { resolve } from 'pathe'
import { defineBuildConfig } from 'unbuild'
import { generateBotMatcherModule } from './scripts/generate-bot-matcher'
import { BOT_MAP } from './src/const-bots'

export default defineBuildConfig({
  declaration: true,
  hooks: {
    'build:before': async function (ctx) {
      await writeFile(
        resolve(ctx.options.rootDir, 'src/generated-bot-matcher.ts'),
        generateBotMatcherModule(BOT_MAP),
      )
    },
  },
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
