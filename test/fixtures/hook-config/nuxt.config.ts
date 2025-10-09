import { createResolver } from '@nuxt/kit'
import NuxtRobots from '../../../src/module'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [NuxtRobots],
  compatibilityDate: '2024-04-03',
  site: {
    url: 'https://example.com',
  },
  nitro: {
    plugins: [resolve('./server/plugins/robots.ts')],
  },
})
