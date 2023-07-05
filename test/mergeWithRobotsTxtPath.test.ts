import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      mergeWithRobotsTxtPath: 'customRobots.txt',
    },
  },
})

describe('mergeWithRobotsTxtPath', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "# START nuxt-simple-robots (indexable)
      User-agent: *
      Allow: /secret/exception
      Disallow: /secret
      Disallow: /admin

      Sitemap: http://localhost/sitemap.xml
      # END nuxt-simple-robots"
    `)

    // hit one of the disallowed routes, check the robots header
    const { headers, _data } = await $fetch.raw('/secret')
    expect(headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    // check meta tag
    expect(_data.includes('<meta name="robots" content="noindex, nofollow">')).toBe(true)
  })
})