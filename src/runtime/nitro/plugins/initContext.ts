import type { NitroApp } from 'nitropack'
import { withoutTrailingSlash } from 'ufo'
import { resolveRobotsTxtContext } from '../util'
import { defineNitroPlugin, getRouteRules, useRuntimeConfig } from '#imports'

const PRERENDER_NO_SSR_ROUTES = new Set(['/index.html', '/200.html', '/404.html'])

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

  // need to inject HTML if we have an SPA route
  nitroApp.hooks.hook('render:html', async (ctx, { event }) => {
    // make sure the route has robots context
    if (!event.context.robots)
      return
    const routeOptions = getRouteRules(event)
    const isIsland = (process.env.NUXT_COMPONENT_ISLANDS && event.path.startsWith('/__nuxt_island'))
    const url = event.path
    const noSSR = !!(process.env.NUXT_NO_SSR)
      || event.context.nuxt?.noSSR
      || (routeOptions.ssr === false && !isIsland)
      || (import.meta.prerender ? PRERENDER_NO_SSR_ROUTES.has(url) : false)
    if (noSSR)
      ctx.head.push(`<meta name="robots" content="${event.context.robots.rule}" />`)
  })
})
