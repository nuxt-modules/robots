import { addTypeTemplate } from '@nuxt/kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerTypeTemplates } from '../../src/templates'

const nitroCompatibility = {
  _tag: 'nitro-v2',
  eventContextModule: 'h3',
  eventContextType: 'H3EventContext',
  eventType: `import('h3').H3Event`,
  nitroTypesModule: 'nitropack',
} as const

const nitro3Compatibility = {
  _tag: 'nitro-v3',
  eventContextModule: 'srvx',
  eventContextType: 'ServerRequestContext',
  eventType: `import('nitro/h3').H3Event`,
  nitroTypesModule: 'nitro/types',
} as const

vi.mock('@nuxt/kit', () => ({
  addTypeTemplate: vi.fn(),
}))

describe('registerTypeTemplates', () => {
  beforeEach(() => {
    vi.mocked(addTypeTemplate).mockClear()
  })

  it('registers Nitro augmentations in the Nuxt node type context', async () => {
    registerTypeTemplates({ nitroCompatibility })

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

    const template = vi.mocked(addTypeTemplate).mock.calls.map(([template]) => template).find(template => template.filename === 'types/nuxt-robots-nitro.d.ts')
    const contents = await template?.getContents?.({} as never)

    expect(contents).toContain('declare module \'nitropack\'')
    expect(contents).toContain('declare module \'nitropack/types\'')
    expect(contents?.match(/interface NitroApp/g)).toHaveLength(2)
  })

  it('targets Nitro 3 public type modules', () => {
    registerTypeTemplates({ nitroCompatibility: nitro3Compatibility })

    const template = vi.mocked(addTypeTemplate).mock.calls.map(([template]) => template).find(template => template.filename === 'types/nuxt-robots-nitro.d.ts')
    const contents = template?.getContents?.({} as never)

    expect(contents).toContain('declare module \'nitro/types\'')
    expect(contents).toContain('declare module \'srvx\'')
    expect(contents).toContain('interface NitroApp')
    expect(contents).not.toContain('declare module \'nitropack/types\'')
  })
})
