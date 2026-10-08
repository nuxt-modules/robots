import { defineNitroPlugin } from '#nuxtseo/nitro'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('site-config:init', ({ event, siteConfig }) => {
    if (event.headers.get('host')?.startsWith('site-staging.'))
      siteConfig.push({ indexable: false, _context: 'host-indexing' })
  })
  nitroApp.hooks.hook('robots:config', (ctx) => {
    if (ctx.event?.headers.get('host')?.includes('staging'))
      ctx.groups[0]!.disallow = ['/']
  })
})
