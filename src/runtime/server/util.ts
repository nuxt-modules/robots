import type { H3Event } from '#nuxtseo/h3'
import type { HookRobotsConfigContext } from '../types'
import { normalizeGroup } from '@nuxtjs/robots/util'
import { useNitroApp } from '#nuxtseo/nitro'
import { useRuntimeConfigNuxtRobots } from './composables/useRuntimeConfigNuxtRobots'

type NitroApp = ReturnType<typeof useNitroApp>

export async function resolveRobotsTxtContext(e: H3Event | undefined, nitro: NitroApp = useNitroApp()) {
  const { groups, sitemap: sitemaps } = useRuntimeConfigNuxtRobots(e)
  // make the config writable
  const generateRobotsTxtCtx: HookRobotsConfigContext<H3Event> = {
    event: e,
    context: e ? 'robots.txt' : 'init',
    errors: [],
    warnings: [],
    ...JSON.parse(JSON.stringify({ groups, sitemaps })),
  }
  await nitro.hooks.callHook('robots:config', generateRobotsTxtCtx)
  generateRobotsTxtCtx.groups = generateRobotsTxtCtx.groups.map(normalizeGroup)
  nitro._robots.ctx = generateRobotsTxtCtx
  return generateRobotsTxtCtx
}
