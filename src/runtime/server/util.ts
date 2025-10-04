import type { H3Event } from 'h3'
import type { NitroApp } from 'nitropack'
import type { HookRobotsConfigContext } from '../types'
import { useNitroApp } from 'nitropack/runtime'
import { normalizeGroup } from '../../util'
import { useRuntimeConfigNuxtRobots } from './composables/useRuntimeConfigNuxtRobots'

export async function resolveRobotsTxtContext(e: H3Event | undefined, nitro: NitroApp = useNitroApp()) {
  const { groups, sitemap: sitemaps } = useRuntimeConfigNuxtRobots(e)
  // make the config writable
  const generateRobotsTxtCtx: HookRobotsConfigContext = {
    event: e,
    context: e ? 'robots.txt' : 'init',
    ...JSON.parse(JSON.stringify({ groups, sitemaps })),
  }
  await nitro.hooks.callHook('robots:config', generateRobotsTxtCtx)
  // Normalize groups after hook to ensure all groups have _indexable property
  generateRobotsTxtCtx.groups = generateRobotsTxtCtx.groups.map(normalizeGroup)
  nitro._robots.ctx = generateRobotsTxtCtx
  return generateRobotsTxtCtx
}
