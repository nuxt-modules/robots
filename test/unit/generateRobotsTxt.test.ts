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
})
