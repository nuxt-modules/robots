import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useNuxt } from '@nuxt/kit'

export default defineNuxtConfig({
  extends: ['../static-headers'],
  alias: { '@nuxtjs/robots/util': fileURLToPath(new URL('../../../src/util.ts', import.meta.url)) },
  robots: { robotsTxt: false, groups: [{ userAgent: '*', contentSignal: 'ai-train=no' }] },
  nitro: { preset: 'cloudflare-module', cloudflare: { deployConfig: true } },
  hooks: {
    'nitro:build:before': (nitro) => {
      nitro.hooks.hook('compiled', () => writeFile(resolve(nitro.options.output.publicDir, '_headers'),
        Array.from({ length: 100 }, (_, index) => `/page-${index}\n  X-Page: ${index}\n`).join('\n')))
    },
    'modules:done': () => {
      if (process.env.NUXT_TEST_SKIP_HEADER_TRIM === 'true')
        return
      const nuxt = useNuxt()
      nuxt.hook('nitro:build:before', (nitro) => {
        nitro.hooks.hook('compiled', async () => {
          const path = resolve(nitro.options.output.publicDir, '_headers')
          const headers = await readFile(path, 'utf8')
          if (!headers.includes('Content-Signal: ai-train=no'))
            throw new Error('The later compiler must observe the generated policy.')
          await writeFile(path, headers.replace('/page-99\n  X-Page: 99\n', ''))
        })
      })
    },
  },
})
