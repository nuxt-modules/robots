import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('../fixtures/i18n'),
  build: true,
  server: true,
  nuxtConfig: {
    routeRules: {
      '/admin/**': { robots: false },
    },
  },
})

function robotsMeta(html: string) {
  return html.match(/<meta name="robots" content="([^"]+)">/)?.[1]
}

describe('i18n route rules', () => {
  it('applies an unprefixed route rule to a locale prefixed path', async () => {
    expect(robotsMeta(await $fetch<string>('/fr/admin/login?mockProductionEnv=true'))).toBe('noindex, nofollow')
  })
})
