import { appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  extends: ['../static-headers'],
  app: { baseURL: '/docs/' },
  alias: { '@nuxtjs/robots/util': fileURLToPath(new URL('../../../src/util.ts', import.meta.url)) },
  robots: { robotsTxt: false, groups: [{ userAgent: '*', contentSignal: 'ai-train=no, search=yes' }] },
  routeRules: { '/api/data.json': { headers: { 'content-signal': 'search=no' } } },
  nitro: { preset: 'cloudflare-module', cloudflare: { deployConfig: true }, prerender: { routes: ['/'] } },
  hooks: {
    'nitro:build:before': (nitro) => {
      const assetDirectory = nitro.options.preset === 'cloudflare-pages' ? '' : 'public'
      nitro.hooks.hook('compiled', () => appendFile(resolve(nitro.options.output.dir, assetDirectory, '_headers'), '\n/*\n  X-Frame-Options: DENY\n'))
    },
  },
})
