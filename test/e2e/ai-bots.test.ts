import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { AiBots, parseRobotsTxt } from '../../src/util'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/basic'),
  build: true,
  server: true,
  nuxtConfig: { robots: { blockAiBots: true } },
})

describe('all AI bots opt-out', () => {
  it('keeps true blocking the complete existing list', async () => {
    const { groups } = parseRobotsTxt(await $fetch('/robots.txt'))
    const blocked = groups.filter(group => group.disallow.includes('/')).flatMap(group => group.userAgent)
    expect(blocked).toEqual(expect.arrayContaining(AiBots))
    expect(blocked).toEqual(expect.arrayContaining(['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot']))
  })
})
