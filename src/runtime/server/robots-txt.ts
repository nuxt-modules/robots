import { defineEventHandler, setHeader } from 'h3'
import { withBase } from 'ufo'
import { useHostname } from '../util-hostname'
import { useNitroApp } from '#internal/nitro'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (e) => {
  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  if (!process.dev)
    setHeader(e, 'Cache-Control', 'max-age=14400, must-revalidate')

  const { disallow, sitemap, indexable, siteUrl } = useRuntimeConfig().public['nuxt-simple-robots']

  const sitemaps: string[] = []
  // validate sitemaps are absolute
  for (const k in sitemap) {
    const entry = sitemap[k]
    if (!entry.startsWith('http')) {
      if (process.env.prerender)
        console.warn('You are prerendering your robots.txt but have not provided a siteUrl. This will result in invalid sitemap entries.')
      // infer siteUrl from runtime config
      sitemaps.push(withBase(entry, siteUrl || useHostname(e)))
    }
    else {
      sitemaps.push(entry)
    }
  }

  const robotsTxt = [
    `# START nuxt-simple-robots (indexable: ${indexable ? 'true' : 'false'})`,
    process.dev ? '# This is a development preview' : false,
    'User-agent: *',
    ...(disallow).map(path => `Disallow: ${path}`),
    '',
    ...(sitemaps).map(path => `Sitemap: ${path}`),
    '# END nuxt-simple-robots',
  ].filter(l => l !== false).join('\n')

  const hookCtx = { robotsTxt }
  const nitro = useNitroApp()
  await nitro.hooks.callHook('robots:robots-txt', hookCtx)
  return hookCtx.robotsTxt
})
