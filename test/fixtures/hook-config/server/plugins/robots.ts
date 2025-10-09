import type { NitroApp } from 'nitropack'
import type { HookRobotsTxtInputContext } from '../../../../../src/runtime/types'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  // Test the new robots:robots-txt:input hook
  nitroApp.hooks.hook('robots:robots-txt:input', async (ctx: HookRobotsTxtInputContext) => {
    // Add groups via the hook
    ctx.groups.push({
      userAgent: ['*'],
      comment: ['Block all from operational endpoints'],
      allow: [],
      disallow: ['/_cwa/*'],
    } as any)

    ctx.groups.push({
      userAgent: ['AhrefsBot'],
      comment: ['Block AI crawlers'],
      allow: [],
      disallow: ['/'],
    } as any)
  })
})
