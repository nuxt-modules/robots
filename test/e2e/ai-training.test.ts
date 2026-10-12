import { createResolver } from '@nuxt/kit'
import { $fetch, fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { parseRobotsTxt } from '../../src/util'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/basic'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      blockAiBots: 'training',
      groups: [{ userAgent: ['CustomBot'], disallow: ['/private'] }],
    },
  },
})

describe('training opt-out', () => {
  it('blocks training tokens without blocking dedicated search and answer agents', async () => {
    const { groups } = parseRobotsTxt(await $fetch('/robots.txt'))
    const blocked = groups.filter(group => group.disallow.includes('/')).flatMap(group => group.userAgent)
    expect(blocked).toEqual(expect.arrayContaining([
      'GPTBot',
      'ClaudeBot',
      'Google-Extended',
      'Applebot-Extended',
      'meta-externalagent',
      'CCBot',
    ]))
    for (const bot of [
      'OAI-SearchBot',
      'ChatGPT-User',
      'Claude-SearchBot',
      'Claude-User',
      'PerplexityBot',
      'Perplexity-User',
      'MistralAI-Index',
      'MistralAI-User',
      'Amzn-SearchBot',
      'Amzn-User',
      'DuckAssistBot',
      'meta-externalfetcher',
    ]) {
      expect(blocked).not.toContain(bot)
    }
    expect(groups.find(group => group.userAgent.includes('CustomBot'))?.disallow).toEqual(['/private'])
  })

  it('keeps ordinary search crawlers and user fetches indexable', async () => {
    for (const bot of ['Googlebot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'PerplexityBot']) {
      const response = await fetch('/', { headers: { 'User-Agent': bot } })
      expect(response.headers.get('x-robots-tag')).not.toContain('noindex')
    }
  })
})
