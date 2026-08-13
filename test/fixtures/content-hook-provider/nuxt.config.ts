import NuxtRobots from '../../../src/module'
import { defineNuxtModule } from '@nuxt/kit'

const ContentHookProvider = defineNuxtModule({
  meta: { name: 'content-hook-provider' },
  setup(_, nuxt) {
    nuxt.hook('modules:done', async () => {
      const context = {
        file: { id: 'pages/index.md' },
        collection: { name: 'pages' },
        content: { path: '/', robots: false, seo: {} },
      }
      await nuxt.callHook('content:file:afterParse' as never, context as never)
      nuxt.options.runtimeConfig.public.contentHook = context.content
    })
  },
})

export default defineNuxtConfig({
  modules: [NuxtRobots, ContentHookProvider],
  runtimeConfig: { public: { contentHook: { seo: {} } } },
  site: { url: 'https://nuxtseo.com' },
  compatibilityDate: '2026-08-14',
})
