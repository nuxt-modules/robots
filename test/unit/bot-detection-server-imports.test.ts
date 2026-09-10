import { createRequire } from 'node:module'
import { addServerImports, addServerImportsDir } from '@nuxt/kit'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@nuxt/kit', async () => {
  const path = await import('node:path')
  return {
    addImports: vi.fn(),
    addPlugin: vi.fn(),
    addPrerenderRoutes: vi.fn(),
    addServerHandler: vi.fn(),
    addServerImports: vi.fn(),
    addServerImportsDir: vi.fn(),
    addServerPlugin: vi.fn(),
    createResolver: () => ({
      resolve: (...args: string[]) => path.resolve(process.cwd(), 'src', ...args),
    }),
    defineNuxtModule: (options: unknown) => options,
    extendRouteRules: vi.fn(),
    hasNuxtModule: vi.fn(() => false),
    addTypeTemplate: vi.fn(),
  }
})

vi.mock('nuxt-site-config/kit', () => ({
  installNuxtSiteConfig: vi.fn(),
  updateSiteConfig: vi.fn(),
}))

vi.mock('nuxtseo-shared/kit', () => ({
  setupNitroRuntimeCompatibility: vi.fn(() => ({ _tag: 'nitro-v2' })),
  useModuleLogger: vi.fn(() => Object.fromEntries(['debug', 'error', 'warn', 'info', 'log'].map(k => [k, vi.fn()]))),
  isNuxtGenerate: vi.fn(() => false),
  resolveContentProvider: vi.fn(async () => ({ _tag: 'None' })),
  resolveNitroPreset: vi.fn(() => 'node-server'),
  renderNitroTypeAugmentations: vi.fn(() => ''),
}))

vi.mock('pkg-types', () => ({
  readPackageJSON: vi.fn(async () => ({ version: '0.0.0' })),
}))

// unimport is what Nitro uses to expand scanned auto-import dirs; it ships with nuxt
const { scanDirExports } = createRequire(createRequire(import.meta.url).resolve('nuxt/package.json'))('unimport') as {
  scanDirExports: (dirs: string[]) => Promise<{ name?: string, as?: string, from: string }[]>
}

const BOT_DETECTION_HELPERS = ['getBotDetection', 'isBot', 'getBotInfo']

function fakeNuxt() {
  return {
    options: {
      dev: false,
      rootDir: process.cwd(),
      app: { baseURL: '', buildAssetsDir: '/_nuxt/' },
      dir: { public: 'public', assets: 'assets', pages: 'pages' },
      experimental: { extraPageMetaExtractionKeys: [] },
      runtimeConfig: { public: {} },
      nitro: { alias: {} },
      alias: {},
      routeRules: {},
    },
    hook: vi.fn(),
    hooks: { hook: vi.fn(), callHook: vi.fn() },
  } as any
}

async function collectServerImportRegistrations(botDetection: boolean) {
  vi.clearAllMocks()
  const { default: module } = await import('../../src/module')
  await module.setup({
    enabled: true,
    botDetection,
    autoI18n: false,
    robotsTxt: false,
    metaTag: false,
    header: false,
    debug: false,
    mergeWithRobotsTxtPath: false,
    blockAiBots: false,
    blockNonSeoBots: false,
  } as any, fakeNuxt())

  const dirs = vi.mocked(addServerImportsDir).mock.calls.flatMap(args => args[0])
  const explicit = vi.mocked(addServerImports).mock.calls.flatMap(args => args[0])
  const scanned = await scanDirExports(dirs)
  // only registrations owned by this module's server runtime
  return [...scanned, ...explicit]
    .map(i => ({ name: (i.as || i.name)!, from: i.from.replace(/\\/g, '/') }))
    .filter(i => i.from.includes('/src/runtime/server/'))
}

describe('server auto-import registration', () => {
  it('registers each bot detection helper exactly once from the mocks when botDetection is false', async () => {
    const registrations = await collectServerImportRegistrations(false)
    const botRegistrations = registrations.filter(i => BOT_DETECTION_HELPERS.includes(i.name))

    for (const name of BOT_DETECTION_HELPERS) {
      const entries = botRegistrations.filter(i => i.name === name)
      expect(entries, `${name} should be registered exactly once`).toHaveLength(1)
      expect(entries[0]!.from, `${name} should come from the mock composables`).toContain('server/mock-composables')
    }
  })

  it('registers each bot detection helper exactly once from the real implementation when botDetection is true', async () => {
    const registrations = await collectServerImportRegistrations(true)
    const botRegistrations = registrations.filter(i => BOT_DETECTION_HELPERS.includes(i.name))

    for (const name of BOT_DETECTION_HELPERS) {
      const entries = botRegistrations.filter(i => i.name === name)
      expect(entries, `${name} should be registered exactly once`).toHaveLength(1)
      expect(entries[0]!.from, `${name} should come from the real composables`).toContain('server/composables/getBotDetection')
      expect(entries[0]!.from).not.toContain('mock')
    }
  })

  it('keeps the non bot detection server composables registered in both modes', async () => {
    for (const botDetection of [false, true]) {
      const registrations = await collectServerImportRegistrations(botDetection)
      for (const name of ['getPathRobotConfig', 'getSiteRobotConfig']) {
        const entries = registrations.filter(i => i.name === name)
        expect(entries, `${name} should be registered exactly once with botDetection: ${botDetection}`).toHaveLength(1)
        expect(entries[0]!.from).toContain('server/composables')
        expect(entries[0]!.from).not.toContain('mock')
      }
    }
  })
})
