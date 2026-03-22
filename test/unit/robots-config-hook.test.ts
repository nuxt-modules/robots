import { describe, expect, it, vi } from 'vitest'
import { resolveRobotsTxtContext } from '../../src/runtime/server/util'

// Mock dependencies
const mockCallHook = vi.fn()
const mockNitroApp = {
  hooks: {
    callHook: mockCallHook,
  },
  _robots: {},
}

vi.mock('nitropack/runtime', () => ({
  useNitroApp: () => mockNitroApp,
  useRuntimeConfig: () => ({
    'public': {},
    'nuxt-robots': {
      groups: [],
      sitemap: [],
    },
  }),
}))

// Mock @nuxtjs/robots/util to use the source file
vi.mock('@nuxtjs/robots/util', async () => {
  return await vi.importActual('../../src/util')
})

// Mock useRuntimeConfigNuxtRobots
vi.mock('../../src/runtime/server/composables/useRuntimeConfigNuxtRobots', () => ({
  useRuntimeConfigNuxtRobots: () => ({
    groups: [],
    sitemap: [],
  }),
}))

describe('resolveRobotsTxtContext', () => {
  it('should normalize groups added via robots:config hook', async () => {
    // Setup hook to add a group without _indexable
    mockCallHook.mockImplementation(async (name, ctx) => {
      if (name === 'robots:config') {
        ctx.groups.push({
          userAgent: ['*'],
          disallow: ['/_cwa/*'],
          allow: [],
          comment: ['Block all from operational endpoints'],
        })
      }
    })

    const ctx = await resolveRobotsTxtContext(undefined)

    // Check if the group was added
    expect(ctx.groups.length).toBe(1)

    // Check if it was normalized
    expect(ctx.groups[0]._normalized).toBe(true)
    expect(ctx.groups[0]._indexable).toBeDefined()
    // Since disallow includes '/_cwa/*', and not '/', _indexable should be true
    expect(ctx.groups[0]._indexable).toBe(true)
    expect(ctx.groups[0]._rules).toBeDefined()
  })
})
