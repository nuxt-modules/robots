import type { NitroApp } from 'nitropack'
import { withoutTrailingSlash } from 'ufo'
import { resolveRobotsTxtContext } from '../util'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

// we need to init our state using a nitro plugin so the user doesn't throttle the resolve context hook
// important when we integrate with nuxt-simple-sitemap and we're checking thousands of URLs
export default defineNitroPlugin(async (nitroApp: NitroApp) => {
  const { usingNuxtContent } = useRuntimeConfig()['nuxt-simple-robots']
  nitroApp._robots = {} as typeof nitroApp._robots
  await resolveRobotsTxtContext(undefined, nitroApp)
  const nuxtContentUrls = new Set<string>()
  if (usingNuxtContent) {
    const urls = await (await nitroApp.localFetch('/__robots__/nuxt-content.json', {})).json()
    urls.forEach((url: string) => nuxtContentUrls.add(withoutTrailingSlash(url)))
  }
  nitroApp._robots.nuxtContentUrls = nuxtContentUrls
})
