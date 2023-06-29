import { defineNitroPlugin } from 'nitropack/runtime/plugin'

export default defineNitroPlugin((nitroApp) => {
  if (process.dev) {
    nitroApp.hooks.hook('robots:robots-txt', async (ctx) => {
      // only if we have existing comments
      if (ctx.robotsTxt.includes("#"))
        // remove comments from robotsTxt
        ctx.robotsTxt = ctx.robotsTxt + '\n# This is a comment added by a hook'
    })
  }
})
