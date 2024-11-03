import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev) {
    nitroApp.hooks.hook('robots:robots-txt', async (ctx) => {
      // only if we have existing comments
      if (ctx.robotsTxt.includes('#'))
        // remove comments from robotsTxt
        ctx.robotsTxt = `${ctx.robotsTxt}\n# This is a comment added by a hook`
    })
  }
})
