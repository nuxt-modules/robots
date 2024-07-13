import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('./fixtures/basic'),
  nuxtConfig: {
    site: {
      trailingSlash: true,
    },
    routeRules: {
      '/hidden-route-rules': {
        index: false,
      },
      '/hidden-route-rules/': {
        index: false,
      },
    },
  },
})

describe('route rule trailing slash', () => {
  it('basic', async () => {
    const hidden = await $fetch('/hidden-route-rules/')
    // use regex to get the robots meta rule, will look like this <meta name="robots" content="noindex, nofollow">
    const robotsMeta = hidden.match(/<meta name="robots" content="(.*)">/)?.[1]

    expect(robotsMeta).toEqual('noindex, nofollow')
  })
})
