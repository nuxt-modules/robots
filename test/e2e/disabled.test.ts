import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('../fixtures/disabled'),
  build: true,
})

describe('disabled module', () => {
  it('should not crash when module is disabled', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Disabled Module Test')
    expect(html).toContain('Module is disabled')
  })

  it('should not have robots.txt when disabled', async () => {
    // The module should not add the robots.txt route when disabled
    await expect($fetch('/robots.txt')).rejects.toThrow()
  })
})
