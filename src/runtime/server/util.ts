import type { RequestEvent } from 'nuxt/server'
import type { HookRobotsConfigContext } from '../types'
import { normalizeGroup } from '@nuxtjs/robots/util'
import { useNitroApp } from '#nuxtseo/nitro'

import { useRuntimeConfigNuxtRobots } from './composables/useRuntimeConfigNuxtRobots'

type NitroApp = ReturnType<typeof useNitroApp>

export async function resolveRobotsTxtContext(e: RequestEvent | undefined, nitro: NitroApp = useNitroApp()) {
  const { groups, sitemap: sitemaps } = useRuntimeConfigNuxtRobots(e)
  // make the config writable
  const generateRobotsTxtCtx: HookRobotsConfigContext<RequestEvent> = {
    event: e,
    context: e ? 'robots.txt' : 'init',
    errors: [],
    warnings: [],
    ...JSON.parse(JSON.stringify({ groups, sitemaps })),
  }
  await nitro.hooks.callHook('robots:config', generateRobotsTxtCtx)
  generateRobotsTxtCtx.groups = generateRobotsTxtCtx.groups.map(normalizeGroup)
  if (!e)
    nitro._robots.ctx = generateRobotsTxtCtx
  return generateRobotsTxtCtx
}
