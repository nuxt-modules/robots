import { addTypeTemplate } from '@nuxt/kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerTypeTemplates } from '../../src/templates'

vi.mock('@nuxt/kit', () => ({
  addTypeTemplate: vi.fn(),
  isNuxtMajorVersion: vi.fn(() => true),
}))

describe('registerTypeTemplates', () => {
  beforeEach(() => {
    vi.mocked(addTypeTemplate).mockClear()
  })

  it('registers Nitro augmentations in the Nuxt node type context', () => {
    registerTypeTemplates({ nuxt: {} as any, config: {} as any })

    expect(addTypeTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'types/nuxt-robots-nitro.d.ts',
      }),
      {
        nitro: true,
        node: true,
        nuxt: true,
      },
    )
  })
})
