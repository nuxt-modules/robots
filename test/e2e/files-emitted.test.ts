import { createResolver } from '@nuxt/kit'
import { setup, useTestContext } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'

const { resolve } = createResolver(import.meta.url)

describe('files emitted', async () => {
  await setup({
    rootDir: resolve('../fixtures/public-robots-txt'),
    build: true,
  })

  it('should not emit _robots.txt', () => {
    const ctx = useTestContext()
    // Check where Nitro is outputting
    const nitroOutputDir = ctx.nuxt!.options.nitro.output?.dir || pathResolve(ctx.nuxt!.options.rootDir, '.output')
    const publicOutputDir = pathResolve(nitroOutputDir, 'public')
    
    expect(existsSync(publicOutputDir), `Public output dir should exist at ${publicOutputDir}`).toBe(true)

    const underscoreRobots = pathResolve(publicOutputDir, '_robots.txt')
    expect(existsSync(underscoreRobots), '_robots.txt should NOT exist in output').toBe(false)
  })
})