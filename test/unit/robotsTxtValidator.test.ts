import { describe, expect, it } from 'vitest'
import { validateRobots } from '../../src/runtime/util'

describe('robotsTxtValidator', () => {
  it('basic', async () => {
    const { errors } = validateRobots({
      errors: [],
      sitemaps: [],
      groups: [
        {
          allow: [],
          comment: [],
          disallow: [],
          userAgent: [
            'Nuclei',
            'WikiDo',
            'Riddler',
            'PetalBot',
            'Zoominfobot',
            'Go-http-client',
            'Node/simplecrawler',
            'CazoodleBot',
            'dotbot/1.0',
            'Gigabot',
            'Barkrowler',
            'BLEXBot',
            'magpie-crawler',
          ],
        },
        {
          allow: [],
          comment: [],
          disallow: [
            'invalid/',
            '-also-invalid',
          ],
          userAgent: [
            '*',
          ],
        },
      ],
    })
    expect(errors).toMatchInlineSnapshot(`
      [
        "Group "Nuclei, WikiDo, Riddler, PetalBot, Zoominfobot, Go-http-client, Node/simplecrawler, CazoodleBot, dotbot/1.0, Gigabot, Barkrowler, BLEXBot, magpie-crawler" has no allow or disallow rules. You must provide one of either.",
        "Disallow rule "invalid/" must start with a \`/\` or be a \`*\`.",
        "Disallow rule "-also-invalid" must start with a \`/\` or be a \`*\`.",
      ]
    `)
  })
})
