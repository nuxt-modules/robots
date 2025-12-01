import type { ContentSignalPreferences, ContentUsagePreferences } from '../../src/runtime/types'
import { describe, expect, it } from 'vitest'
import { generateRobotsTxt, normalizeGroup, parseRobotsTxt, validateRobots } from '../../src/runtime/util'

describe('contentSignal', () => {
  describe('type safety', () => {
    it('contentUsagePreferences type', () => {
      const prefs: ContentUsagePreferences = {
        'bots': 'y',
        'train-ai': 'n',
        'ai-output': 'y',
        'search': 'n',
      }
      expect(prefs).toBeDefined()
    })

    it('contentSignalPreferences type', () => {
      const prefs: ContentSignalPreferences = {
        'search': 'yes',
        'ai-input': 'no',
        'ai-train': 'no',
      }
      expect(prefs).toBeDefined()
    })
  })

  describe('parsing', () => {
    it('parses Content-Signal separately from Content-Usage', () => {
      const robotsTxt = `
User-Agent: *
Allow: /
Content-Usage: bots=y, train-ai=n
Content-Signal: ai-train=no, search=yes
      `
      const parsed = parseRobotsTxt(robotsTxt)
      expect(parsed.groups[0]?.contentUsage).toEqual(['bots=y, train-ai=n'])
      expect(parsed.groups[0]?.contentSignal).toEqual(['ai-train=no, search=yes'])
    })

    it('handles path-specific Content-Signal rules', () => {
      const robotsTxt = `
User-Agent: *
Allow: /
Content-Signal: /api/ ai-train=no
Content-Signal: /public/ search=yes, ai-input=yes
      `
      const parsed = parseRobotsTxt(robotsTxt)
      expect(parsed.groups[0]?.contentSignal).toEqual([
        '/api/ ai-train=no',
        '/public/ search=yes, ai-input=yes',
      ])
    })

    it('handles multiple Content-Signal directives', () => {
      const robotsTxt = `
User-Agent: *
Allow: /
Content-Signal: ai-train=no
Content-Signal: search=yes
Content-Signal: ai-input=no
      `
      const parsed = parseRobotsTxt(robotsTxt)
      expect(parsed.groups[0]?.contentSignal).toEqual([
        'ai-train=no',
        'search=yes',
        'ai-input=no',
      ])
    })

    it('handles mixed case directive names', () => {
      const robotsTxt = `
User-Agent: *
Allow: /
content-signal: ai-train=no
Content-Signal: search=yes
CONTENT-SIGNAL: ai-input=no
      `
      const parsed = parseRobotsTxt(robotsTxt)
      expect(parsed.groups[0]?.contentSignal).toEqual([
        'ai-train=no',
        'search=yes',
        'ai-input=no',
      ])
    })
  })

  describe('validation', () => {
    it('validates Content-Signal categories', () => {
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
              'invalid-category=yes',
            ],
          },
        ],
      })
      expect(errors).toContain('Content-Signal category "invalid-category" is invalid. Valid categories: search, ai-input, ai-train.')
    })

    it('validates Content-Signal values', () => {
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
              'ai-train=y',
              'search=n',
            ],
          },
        ],
      })
      expect(errors).toContain('Content-Signal value "y" for "ai-train" is invalid. Valid values: yes, no.')
      expect(errors).toContain('Content-Signal value "n" for "search" is invalid. Valid values: yes, no.')
    })

    it('validates Content-Signal must have equals sign', () => {
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
              'ai-train',
            ],
          },
        ],
      })
      expect(errors).toContain('Content-Signal rule "ai-train" must contain a preference assignment (e.g., "ai-train=no").')
    })

    it('validates path must start with slash', () => {
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
              'api/ ai-train=no',
            ],
          },
        ],
      })
      expect(errors).toContain('Content-Signal path "api/" must start with a `/`.')
    })

    it('validates empty Content-Signal rules', () => {
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
              '',
            ],
          },
        ],
      })
      expect(errors).toContain('Content-Signal rule cannot be empty.')
    })

    it('validates multiple preferences in one line', () => {
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
              'ai-train=no, search=yes, invalid=yes',
            ],
          },
        ],
      })
      expect(errors).toContain('Content-Signal category "invalid" is invalid. Valid categories: search, ai-input, ai-train.')
    })

    it('accepts valid Content-Signal rules', () => {
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
              'search=yes',
              'ai-input=no',
              '/api/ ai-train=no',
              '/public/ search=yes, ai-input=yes',
            ],
          },
        ],
      })
      expect(errors).toHaveLength(0)
    })
  })

  describe('normalization', () => {
    it('normalizes contentSignal from string to array', () => {
      const group = {
        userAgent: ['*'],
        allow: ['/'],
        disallow: [],
        comment: [],
        contentSignal: 'ai-train=no',
      }
      // @ts-expect-error - testing runtime normalization
      const normalized = normalizeGroup(group)
      expect(normalized.contentSignal).toEqual(['ai-train=no'])
    })

    it('normalizes contentSignal from object to array', () => {
      const group = {
        userAgent: ['*'],
        allow: ['/'],
        disallow: [],
        comment: [],
        contentSignal: {
          'ai-train': 'no',
          'search': 'yes',
          'ai-input': 'no',
        },
      }
      const normalized = normalizeGroup(group)
      expect(normalized.contentSignal).toEqual(['ai-train=no, search=yes, ai-input=no'])
    })

    it('normalizes contentUsage from object to array', () => {
      const group = {
        userAgent: ['*'],
        allow: ['/'],
        disallow: [],
        comment: [],
        contentUsage: {
          'bots': 'y',
          'train-ai': 'n',
        },
      }
      const normalized = normalizeGroup(group)
      expect(normalized.contentUsage).toEqual(['bots=y, train-ai=n'])
    })

    it('handles partial object preferences', () => {
      const group = {
        userAgent: ['*'],
        allow: ['/'],
        disallow: [],
        comment: [],
        contentSignal: {
          'ai-train': 'no',
        },
      }
      const normalized = normalizeGroup(group)
      expect(normalized.contentSignal).toEqual(['ai-train=no'])
    })

    it('filters empty contentSignal rules', () => {
      const group = {
        userAgent: ['*'],
        allow: ['/'],
        disallow: [],
        comment: [],
        contentSignal: ['ai-train=no', '', 'search=yes'],
      }
      const normalized = normalizeGroup(group)
      expect(normalized.contentSignal).toEqual(['ai-train=no', 'search=yes'])
    })

    it('handles undefined contentSignal', () => {
      const group = {
        userAgent: ['*'],
        allow: ['/'],
        disallow: [],
        comment: [],
      }
      const normalized = normalizeGroup(group)
      expect(normalized.contentSignal).toEqual([])
    })
  })

  describe('generation', () => {
    it('generates Content-Signal directives', () => {
      const robotsData = {
        groups: [
          {
            userAgent: ['*'],
            allow: ['/'],
            disallow: [],
            comment: [],
            contentSignal: [
              'ai-train=no',
              'search=yes',
              'ai-input=no',
            ],
          },
        ],
        sitemaps: [],
      }

      const generated = generateRobotsTxt(robotsData)
      expect(generated).toContain('Content-Signal: ai-train=no')
      expect(generated).toContain('Content-Signal: search=yes')
      expect(generated).toContain('Content-Signal: ai-input=no')
    })

    it('generates both Content-Usage and Content-Signal', () => {
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
        sitemaps: [],
      }

      const generated = generateRobotsTxt(robotsData)
      expect(generated).toContain('Content-Usage: bots=y')
      expect(generated).toContain('Content-Usage: train-ai=n')
      expect(generated).toContain('Content-Signal: ai-train=no')
      expect(generated).toContain('Content-Signal: search=yes')
    })

    it('maintains order of directives', () => {
      const robotsData = {
        groups: [
          {
            userAgent: ['*'],
            allow: ['/'],
            disallow: [],
            comment: [],
            contentUsage: ['bots=y'],
            contentSignal: ['ai-train=no'],
          },
        ],
        sitemaps: [],
      }

      const generated = generateRobotsTxt(robotsData)
      const lines = generated.split('\n')
      const contentUsageIndex = lines.findIndex(line => line.startsWith('Content-Usage:'))
      const contentSignalIndex = lines.findIndex(line => line.startsWith('Content-Signal:'))
      expect(contentUsageIndex).toBeLessThan(contentSignalIndex)
    })

    it('generates from object format', () => {
      const robotsData = {
        groups: [
          {
            userAgent: ['*'],
            allow: ['/'],
            disallow: [],
            comment: [],
            contentUsage: {
              'bots': 'y',
              'train-ai': 'n',
            },
            contentSignal: {
              'ai-train': 'no',
              'search': 'yes',
            },
          },
        ],
        sitemaps: [],
      }

      const normalized = normalizeGroup(robotsData.groups[0])
      const generated = generateRobotsTxt({ groups: [normalized], sitemaps: [] })
      expect(generated).toContain('Content-Usage: bots=y, train-ai=n')
      expect(generated).toContain('Content-Signal: ai-train=no, search=yes')
    })
  })

  describe('round-trip parsing and generation', () => {
    it('parses and regenerates Content-Signal correctly', () => {
      const original = `User-agent: *
Allow: /
Content-Signal: ai-train=no
Content-Signal: search=yes, ai-input=yes

`
      const parsed = parseRobotsTxt(original)
      const generated = generateRobotsTxt(parsed)
      expect(generated.trim()).toEqual(original.trim())
    })

    it('parses and regenerates mixed Content-Usage and Content-Signal', () => {
      const original = `User-agent: *
Allow: /
Content-Usage: bots=y
Content-Signal: ai-train=no

`
      const parsed = parseRobotsTxt(original)
      const generated = generateRobotsTxt(parsed)
      expect(generated.trim()).toEqual(original.trim())
    })
  })

  describe('edge cases', () => {
    it('handles Content-Signal with spaces in values', () => {
      const robotsTxt = `
User-Agent: *
Allow: /
Content-Signal: ai-train=no, search=yes
      `
      const parsed = parseRobotsTxt(robotsTxt)
      expect(parsed.groups[0]?.contentSignal).toEqual(['ai-train=no, search=yes'])
    })

    it('handles Content-Signal with comments', () => {
      const robotsTxt = `
User-Agent: *
Allow: /
Content-Signal: ai-train=no # no AI training
      `
      const parsed = parseRobotsTxt(robotsTxt)
      // Comments are stripped during parsing
      expect(parsed.groups[0]?.contentSignal).toEqual(['ai-train=no'])
    })

    it('handles multiple user agents with different Content-Signal rules', () => {
      const robotsTxt = `
User-Agent: GPTBot
Disallow: /api/
Content-Signal: ai-train=no

User-Agent: *
Allow: /
Content-Signal: ai-train=yes
      `
      const parsed = parseRobotsTxt(robotsTxt)
      expect(parsed.groups[0]?.contentSignal).toEqual(['ai-train=no'])
      expect(parsed.groups[1]?.contentSignal).toEqual(['ai-train=yes'])
    })
  })
})
