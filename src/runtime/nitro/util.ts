import type { NitroApp } from 'nitropack'
import type { H3Event } from 'h3'
import type { HookRobotsConfigContext } from '../types'
import { useNitroApp, useRuntimeConfig } from '#imports'

export async function resolveRobotsTxtContext(e: H3Event | undefined, nitro: NitroApp = useNitroApp()) {
  const { groups, sitemap: sitemaps } = useRuntimeConfig()['nuxt-robots']
  // make the config writable
  const generateRobotsTxtCtx: HookRobotsConfigContext = {
    event: e,
    context: e ? 'robots.txt' : 'init',
    ...JSON.parse(JSON.stringify({ groups, sitemaps })),
  }
  await nitro.hooks.callHook('robots:config', generateRobotsTxtCtx)
  nitro._robots.ctx = generateRobotsTxtCtx
  return generateRobotsTxtCtx
}
