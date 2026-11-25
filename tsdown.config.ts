import { writeFile } from 'node:fs/promises'
import { builder } from '@nuxt/module-builder/tsdown'
import { defineConfig } from 'tsdown'
import { generateBotMatcherModule } from './scripts/generate-bot-matcher.ts'
import { BOT_MAP } from './src/const-bots.ts'

export default defineConfig({
  hooks: {
    'build:prepare': () => writeFile(new URL('./src/generated-bot-matcher.ts', import.meta.url), generateBotMatcherModule(BOT_MAP)),
  },
  plugins: [
    builder({
      entries: [
        './src/content',
        './src/content-valibot',
        './src/util',
      ],
      externals: [
        'h3',
        'std-env',
        'nitropack',
        'consola',
        '@nuxt/content',
        'valibot',
        'zod',
        'nuxt/server',
      ],
    }),
  ],
})
