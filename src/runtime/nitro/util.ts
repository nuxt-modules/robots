import type { HookRobotsConfigContext } from '../types'
import { useNitroApp, useRuntimeConfig } from '#imports'

export async function resolveRobotsTxtContext(ctx: 'robots.txt' | 'middleware' | string) {
  const nitro = useNitroApp()
  const { groups, sitemap: sitemaps } = useRuntimeConfig()['nuxt-simple-robots']
  // make the config writable
  const generateRobotsTxtCtx: HookRobotsConfigContext = JSON.parse(JSON.stringify({ groups, sitemaps, context: ctx }))
  await nitro.hooks.callHook('robots:config', generateRobotsTxtCtx)
  return generateRobotsTxtCtx
}
