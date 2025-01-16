import { createResolver } from '@nuxt/kit'
import NuxtRobots from '../../../src/module'

const resolver = createResolver(import.meta.url)

const nuxtContent3Resolved = resolver.resolve('node_modules/@nuxt/content/dist/module.mjs')

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
    nuxtContent3Resolved,
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
    '@nuxt/content': nuxtContent3Resolved,
    'remarkRobots': resolver.resolve('remarkRobots.ts'),
  },

  debug: process.env.NODE_ENV === 'test',
  compatibilityDate: '2024-12-06',
})
