import fsp from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { generateRobotsTxt, parseRobotsTxt } from '../../src/runtime/util'

describe('generateRobotsTxt', () => {
  it('yoast', async () => {
    // read fixture yoastRobots.txt
    const robotsTxt = await fsp.readFile('./test/fixtures/yoastRobots.txt', { encoding: 'utf-8' })
    const parsed = parseRobotsTxt(robotsTxt)
    const generated = generateRobotsTxt(parsed)
    expect(generated).toMatchInlineSnapshot(`
      "User-agent: *
      Disallow: /wp-json/
      Disallow: /?s=*
      Disallow: /search/*
      Disallow: /cdn-cgi/bm/cv/
      Disallow: /cdn-cgi/challenge-platform/

      User-agent: Nuclei
      User-agent: WikiDo
      User-agent: Riddler
      User-agent: PetalBot
      User-agent: Zoominfobot
      User-agent: Go-http-client
      User-agent: Node/simplecrawler
      User-agent: CazoodleBot
      User-agent: dotbot/1.0
      User-agent: Gigabot
      User-agent: Barkrowler
      User-agent: BLEXBot
      User-agent: magpie-crawler
      Disallow: /

      Sitemap: https://yoast.com/sitemap_index.xml"
    `)
    expect(robotsTxt).toMatch(generated)
  })

  it('squareSpace', async () => {
    // read fixture yoastRobots.txt
    const robotsTxt = await fsp.readFile('./test/fixtures/squareSpace.txt', { encoding: 'utf-8' })
    const parsed = parseRobotsTxt(robotsTxt)
    const generated = generateRobotsTxt(parsed)
    expect(robotsTxt.trim()).toEqual(generated.trim())
  })

  it('content-usage generation', () => {
    const robotsData = {
      groups: [
        {
          userAgent: ['*'],
          allow: ['/'],
          disallow: [],
          comment: [],
          contentUsage: [
            'bots=y',
            '/public/ train-ai=y',
            '/restricted/ train-ai=n, ai-output=n',
          ],
        },
      ],
      sitemaps: ['https://example.com/sitemap.xml'],
    }

    const generated = generateRobotsTxt(robotsData)
    expect(generated).toMatchInlineSnapshot(`
      "User-agent: *
      Allow: /
      Content-Usage: bots=y
      Content-Usage: /public/ train-ai=y
      Content-Usage: /restricted/ train-ai=n, ai-output=n

      Sitemap: https://example.com/sitemap.xml"
    `)
  })

  it('content-signal generation', () => {
    const robotsData = {
      groups: [
        {
          userAgent: ['*'],
          allow: ['/'],
          disallow: [],
          comment: [],
          contentSignal: [
            'ai-train=no',
            '/public/ search=yes, ai-input=yes',
            '/restricted/ ai-train=no, ai-input=no',
          ],
        },
      ],
      sitemaps: ['https://example.com/sitemap.xml'],
    }

    const generated = generateRobotsTxt(robotsData)
    expect(generated).toMatchInlineSnapshot(`
      "User-agent: *
      Allow: /
      Content-Signal: ai-train=no
      Content-Signal: /public/ search=yes, ai-input=yes
      Content-Signal: /restricted/ ai-train=no, ai-input=no

      Sitemap: https://example.com/sitemap.xml"
    `)
  })

  it('mixed content-usage and content-signal generation', () => {
    const robotsData = {
      groups: [
        {
          userAgent: ['*'],
          allow: ['/'],
          disallow: [],
          comment: [],
          contentUsage: [
            'bots=y',
            'train-ai=n',
          ],
          contentSignal: [
            'ai-train=no',
            'search=yes',
          ],
        },
      ],
      sitemaps: ['https://example.com/sitemap.xml'],
    }

    const generated = generateRobotsTxt(robotsData)
    expect(generated).toMatchInlineSnapshot(`
      "User-agent: *
      Allow: /
      Content-Usage: bots=y
      Content-Usage: train-ai=n
      Content-Signal: ai-train=no
      Content-Signal: search=yes

      Sitemap: https://example.com/sitemap.xml"
    `)
  })
})
