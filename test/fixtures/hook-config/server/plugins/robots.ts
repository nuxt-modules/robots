import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp) => {
  // Replicate the user's code from issue #233
  nitroApp.hooks.hook('robots:config', async (ctx) => {
    // Add groups via the hook - these will NOT be normalized
    ctx.groups.push({
      userAgent: ['*'],
      comment: ['Block all from operational endpoints'],
      allow: [],
      disallow: ['/_cwa/*'],
    })

    ctx.groups.push({
      userAgent: ['AhrefsBot'],
      comment: ['Block AI crawlers'],
      allow: [],
      disallow: ['/'],
    })
  })
})
