import { defineEventHandler, setHeader } from 'h3'
import { useNitroApp, useRuntimeConfig } from '#internal/nitro'

export default defineEventHandler(async (e) => {
  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  if (!process.dev)
    setHeader(e, 'Cache-Control', 'max-age=14400, must-revalidate')

  const { disallow, sitemap, indexable } = useRuntimeConfig().public['nuxt-simple-robots']
  const robotsTxt = [
    `# START nuxt-simple-robots (indexable: ${indexable ? 'true' : 'false'})`,
    process.dev ? '# This is a development preview' : false,
    'User-agent: *',
    ...(disallow).map(path => `Disallow: ${path}`),
    '',
    ...(sitemap).map(path => `Sitemap: ${path}`),
    '# END nuxt-simple-robots',
  ].filter(l => l !== false).join('\n')

  const hookCtx = { robotsTxt }
  const nitro = useNitroApp()
  await nitro.hooks.callHook('robots:robots-txt', hookCtx)
  return hookCtx.robotsTxt
})
