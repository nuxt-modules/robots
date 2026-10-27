import { createResolver } from '@nuxt/kit'
import NuxtRobots from '../../../src/module'

const resolver = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    (_options, nuxt) => {
      // Content caches hook results, so builds with different Robots options need separate databases.
      if (nuxt.options.content)
        nuxt.options.content._localDatabase = { type: 'sqlite', filename: resolver.resolve(nuxt.options.buildDir, 'content.sqlite') }
    },
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
