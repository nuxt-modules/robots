import type { Nuxt } from '@nuxt/schema'
import type { NitroConfig } from 'nitropack'
import type { NuxtModule } from 'nuxt/schema'
import { loadNuxtModuleInstance, useNuxt } from '@nuxt/kit'
import { env, provider } from 'std-env'

const autodetectableProviders = {
  azure_static: 'azure',
  cloudflare_pages: 'cloudflare-pages',
  netlify: 'netlify',
  stormkit: 'stormkit',
  vercel: 'vercel',
  cleavr: 'cleavr',
  stackblitz: 'stackblitz',
}

const autodetectableStaticProviders = {
  netlify: 'netlify-static',
  vercel: 'vercel-static',
}

export function detectTarget(options: { static?: boolean } = {}) {
  // @ts-expect-error untyped
  return options?.static ? autodetectableStaticProviders[provider] : autodetectableProviders[provider]
}

export function resolveNitroPreset(nitroConfig?: NitroConfig): string {
  if (provider === 'stackblitz' || provider === 'codesandbox')
    return provider
  let preset
  if (nitroConfig && nitroConfig?.preset)
    preset = nitroConfig.preset
  if (!preset)
    preset = env.NITRO_PRESET || detectTarget() || 'node-server'
  return preset.replace('_', '-') // sometimes they are different
}

/**
 * Get the user provided options for a Nuxt module.
 *
 * These options may not be the resolved options that the module actually uses.
 * @param module
 * @param nuxt
 */
export async function getNuxtModuleOptions(module: string | NuxtModule, nuxt: Nuxt = useNuxt()) {
  const moduleMeta = (typeof module === 'string' ? { name: module } : await module.getMeta?.()) || {}
  const { nuxtModule } = (await loadNuxtModuleInstance(module, nuxt))

  let moduleEntry: [string | NuxtModule, Record<string, any>] | undefined
  for (const m of nuxt.options.modules) {
    if (Array.isArray(m) && m.length >= 2) {
      const _module = m[0]
      const _moduleEntryName = typeof _module === 'string'
        ? _module
        : (await (_module as any as NuxtModule).getMeta?.())?.name || ''
      if (_moduleEntryName === moduleMeta.name)
        moduleEntry = m as [string | NuxtModule, Record<string, any>]
    }
  }

  let inlineOptions = {}
  if (moduleEntry)
    inlineOptions = moduleEntry[1]
  if (nuxtModule.getOptions)
    return nuxtModule.getOptions(inlineOptions, nuxt)
  return inlineOptions
}

export function isNuxtGenerate(nuxt: Nuxt = useNuxt()) {
  return nuxt.options.nitro.static || (nuxt.options as any)._generate /* TODO: remove in future */ || [
    'static',
    'github-pages',
  ].includes(resolveNitroPreset(nuxt.options.nitro))
}
