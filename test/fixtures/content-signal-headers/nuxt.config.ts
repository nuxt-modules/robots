import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  extends: ['../static-headers'],
  app: { baseURL: '/docs/' },
  alias: { '@nuxtjs/robots/util': fileURLToPath(new URL('../../../src/util.ts', import.meta.url)) },
  robots: { robotsTxt: false, groups: [{ userAgent: '*', contentSignal: 'ai-train=no, search=yes' }] },
  routeRules: { '/api/data.json': { headers: { 'content-signal': 'search=no' } } },
  nitro: { preset: 'cloudflare-module', cloudflare: { deployConfig: true }, prerender: { routes: ['/'] } },
})
