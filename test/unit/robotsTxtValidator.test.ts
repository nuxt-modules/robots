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
            'bots=y',
            '/public/ train-ai=y',
            'invalid-preference',
            'invalid-path train-ai=n',
            '',
            'invalid-cat=y',
            'train-ai=maybe',
          ],
        },
      ],
    })
    expect(errors).toMatchInlineSnapshot(`
      [
        "Content-Usage rule "invalid-preference" must contain a preference assignment (e.g., "train-ai=n").",
        "Content-Usage path "invalid-path" must start with a \`/\`.",
        "Content-Usage rule cannot be empty.",
        "Content-Usage category "invalid-cat" is invalid. Valid categories: bots, train-ai, ai-output, search.",
        "Content-Usage value "maybe" for "train-ai" is invalid. Valid values: y, n.",
      ]
    `)
  })

  it('content-signal validation', () => {
    const { errors } = validateRobots({
      errors: [],
      sitemaps: [],
      groups: [
        {
          allow: ['/'],
          comment: [],
          disallow: [],
          userAgent: ['*'],
          contentSignal: [
            'ai-train=no',
            '/public/ search=yes, ai-input=yes',
            'invalid-preference',
            'invalid-path ai-train=no',
            '',
            'invalid-cat=yes',
            'ai-train=maybe',
          ],
        },
      ],
    })
    expect(errors).toMatchInlineSnapshot(`
      [
        "Content-Signal rule "invalid-preference" must contain a preference assignment (e.g., "ai-train=no").",
        "Content-Signal path "invalid-path" must start with a \`/\`.",
        "Content-Signal rule cannot be empty.",
        "Content-Signal category "invalid-cat" is invalid. Valid categories: search, ai-input, ai-train.",
        "Content-Signal value "maybe" for "ai-train" is invalid. Valid values: yes, no.",
      ]
    `)
  })
})
