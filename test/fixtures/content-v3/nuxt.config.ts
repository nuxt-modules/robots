import { createResolver } from '@nuxt/kit'
import NuxtRobots from '../../../src/module'

const resolver = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
    '@nuxt/content',
  ],

  content: {
    build: {
      markdown: {
        remarkPlugins: {
          // [resolver.resolve('remarkRobots.mjs')]: {},
        },
      },
    },
  },

  site: {
    url: 'https://nuxtseo.com',
  },

  alias: {
    remarkRobots: resolver.resolve('remarkRobots.ts'),
  },

  compatibilityDate: '2024-12-06',
})
