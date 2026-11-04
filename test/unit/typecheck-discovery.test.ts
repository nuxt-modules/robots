import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { createVitest } from 'vitest/node'

it('keeps Nuxt 5 compiler fixtures out of the Nuxt 4 typecheck project', async () => {
  const runner = await createVitest({
    project: ['typecheck'],
    watch: false,
  })
  try {
    const specifications = await runner.globTestSpecifications()
    const files = specifications.map(specification => specification.moduleId)
    expect(files).toContain(fileURLToPath(new URL('../types/templates.test-d.ts', import.meta.url)))
    expect(files).not.toContain(fileURLToPath(new URL('../fixtures/nuxt5/route-rules.test-d.ts', import.meta.url)))
  }
  finally {
    await runner.close()
  }
})
