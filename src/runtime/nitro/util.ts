import type { NitroApp } from 'nitropack'
import type { HookRobotsConfigContext } from '../types'
import { useNitroApp, useRuntimeConfig } from '#imports'

export async function resolveRobotsTxtContext(ctx: 'robots.txt' | 'init' | string, nitro: NitroApp = useNitroApp()) {
  const { groups, sitemap: sitemaps } = useRuntimeConfig()['nuxt-simple-robots']
  // make the config writable
  const generateRobotsTxtCtx: HookRobotsConfigContext = JSON.parse(JSON.stringify({ groups, sitemaps, context: ctx }))
  await nitro.hooks.callHook('robots:config', generateRobotsTxtCtx)
  nitro._robots.ctx = generateRobotsTxtCtx
  return generateRobotsTxtCtx
}
