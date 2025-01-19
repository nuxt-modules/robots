import type { NitroApp } from 'nitropack/types'
import { defineNitroPlugin, getRouteRules, useRuntimeConfig } from 'nitropack/runtime'
import { withoutTrailingSlash } from 'ufo'
import { logger } from '../logger'
import { resolveRobotsTxtContext } from '../util'

const PRERENDER_NO_SSR_ROUTES = new Set(['/index.html', '/200.html', '/404.html'])

// we need to init our state using a nitro plugin so the user doesn't throttle the resolve context hook
// important when we integrate with nuxt-simple-sitemap and we're checking thousands of URLs
export default defineNitroPlugin(async (nitroApp: NitroApp) => {
  const { isNuxtContentV2, robotsDisabledValue } = useRuntimeConfig()['nuxt-robots']
  nitroApp._robots = {} as typeof nitroApp._robots
  await resolveRobotsTxtContext(undefined, nitroApp)
  const nuxtContentUrls = new Set<string>()
  if (isNuxtContentV2) {
    let urls: string[] | undefined
    try {
      urls = await (await nitroApp.localFetch('/__robots__/nuxt-content.json', {})).json()
    }
    catch (e) {
      logger.error('Failed to read robot rules from content files.', e)
    }
    if (urls && Array.isArray(urls) && urls.length) {
      urls.forEach((url: string) => nuxtContentUrls.add(withoutTrailingSlash(url)))
    }
  }
  if (nuxtContentUrls.size) {
    nitroApp._robots.nuxtContentUrls = nuxtContentUrls
  }

  if (import.meta.prerender) {
    // need to inject HTML if we have an SPA route
    nitroApp.hooks.hook('render:html', async (ctx, { event }) => {
      const routeOptions = getRouteRules(event)
      const isIsland = (process.env.NUXT_COMPONENT_ISLANDS && event.path.startsWith('/__nuxt_island'))
      const noSSR = !!(process.env.NUXT_NO_SSR)
        || event.context.nuxt?.noSSR
        || (routeOptions.ssr === false && !isIsland)
        || (import.meta.prerender ? PRERENDER_NO_SSR_ROUTES.has(event.path) : false)
      if (noSSR) {
        let rule = event.context.robots?.rule
        if (event.path === '/404.html')
          rule = robotsDisabledValue
        if (rule)
          ctx.head.push(`<meta name="robots" content="${rule}" />`)
      }
    })
  }
})
