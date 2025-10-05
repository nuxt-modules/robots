import type { NitroApp } from 'nitropack'
import type { HookRobotsTxtInputContext } from '../../../../../src/runtime/types'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  nitroApp.hooks.hook('robots:robots-txt:input', async (ctx: HookRobotsTxtInputContext) => {
    // Edge case 1: Add group with no disallow/allow (invalid but shouldn't crash)
    ctx.groups.push({
      userAgent: 'EdgeCaseBot1',
    } as any)

    // Edge case 2: Add group that's already normalized (double normalization test)
    ctx.groups.push({
      userAgent: ['EdgeCaseBot2'],
      disallow: ['/'],
      allow: [],
      _indexable: false,
      _rules: [{ pattern: '/', allow: false }],
    } as any)

    // Edge case 3: Modify existing groups from config
    // This tests if normalization preserves modifications
    if (ctx.groups.length > 0 && ctx.groups[0]) {
      ctx.groups[0].disallow?.push('/hook-added-path')
    }

    // Edge case 4: Add group with "/" mixed with other patterns
    ctx.groups.push({
      userAgent: ['EdgeCaseBot3'],
      disallow: ['/admin', '/', '/api'],
    } as any)

    // Edge case 5: Add group with non-array values (tests asArray conversion)
    ctx.groups.push({
      userAgent: 'EdgeCaseBot4',
      disallow: '/single-string-disallow',
      allow: '/single-string-allow',
    } as any)

    // Edge case 6: Add group with special characters and whitespace
    ctx.groups.push({
      userAgent: ['  Bot With Spaces  ', 'Bot*With?Special[Chars]'],
      disallow: ['  /path-with-spaces  ', '/normal'],
    } as any)

    // Edge case 7: Completely remove groups (extreme case)
    // Commented out because it would break robots.txt generation
    // ctx.groups = []

    // Edge case 8: Add duplicate user agents
    ctx.groups.push({
      userAgent: ['*'], // Duplicate of default
      disallow: ['/duplicate-test'],
    } as any)
  })
})
