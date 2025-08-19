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

  it('content-usage validation', () => {
    const { errors } = validateRobots({
      errors: [],
      sitemaps: [],
      groups: [
        {
          allow: ['/'],
          comment: [],
          disallow: [],
          userAgent: ['*'],
          contentUsage: [
            'ai=n',
            '/public/ train-ai=y',
            'invalid-preference',
            'invalid-path ai=n',
            '',
          ],
        },
      ],
    })
    expect(errors).toMatchInlineSnapshot(`
      [
        "Content-Usage rule "invalid-preference" must contain a preference assignment (e.g., "ai=n").",
        "Content-Usage path "invalid-path" must start with a \`/\`.",
        "Content-Usage rule cannot be empty.",
      ]
    `)
  })
})
