import { createPatternMap } from '@nuxtjs/robots/util'
import { getRouteRules } from 'nuxt/server'
// @ts-expect-error Virtual server template registered by the module.
import { ROBOTS_SSR_DEFAULT } from '#nuxt-robots/ssr-default.mjs'
import { defineNitroPlugin } from '#nuxtseo/nitro'
import { useRuntimeConfigNuxtRobots } from '../composables/useRuntimeConfigNuxtRobots'
import { resolveRobotsTxtContext } from '../util'

const PRERENDER_NO_SSR_ROUTES = new Set(['/index.html', '/200.html', '/404.html'])

// we need to init our state using a nitro plugin so the user doesn't throttle the resolve context hook
// important when we integrate with nuxt-simple-sitemap and we're checking thousands of URLs
export default defineNitroPlugin(async (nitroApp) => {
  const { robotsDisabledValue, botDetection } = useRuntimeConfigNuxtRobots()

  // Initialize bot detection pattern map if enabled
  if (botDetection !== false) {
    nitroApp._robotsPatternMap = createPatternMap()
  }

  nitroApp._robots = {} as typeof nitroApp._robots
  await resolveRobotsTxtContext(undefined, nitroApp)

  if (import.meta.prerender) {
    // need to inject HTML if we have an SPA route
    nitroApp.hooks.hook('render:html', async (ctx, { event }) => {
      const routeOptions = getRouteRules(event)
      const isIsland = (process.env.NUXT_COMPONENT_ISLANDS && event.path.startsWith('/__nuxt_island'))
      const noSSR = !!(process.env.NUXT_NO_SSR)
        || event.context.nuxt?.noSSR
        || ((routeOptions.ssr ?? ROBOTS_SSR_DEFAULT) === false && !isIsland)
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
