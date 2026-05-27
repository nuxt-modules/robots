import type {
  HookRobotsConfigContext,
  HookRobotsTxtContext,
  RobotsContext,
  RobotsValue,
} from '@nuxtjs/robots'
import type { H3EventContext } from 'h3'
import type { NitroRouteConfig as NitroRouteConfigPack, NitroRouteRules as NitroRouteRulesPack } from 'nitropack'
import type { NitroRouteConfig, NitroRouteRules, NitroRuntimeHooks } from 'nitropack/types'
import type { NuxtConfig } from 'nuxt/schema'
import type { PageMeta } from '#app'
import { extendRouteRules } from '@nuxt/kit'
import { describe, expectTypeOf, it } from 'vitest'

// Tests the generated type augmentations from .nuxt/types/nuxt-robots-*.d.ts.
// Requires `nuxi prepare` to have been run so .nuxt/ exists.
// The playground targets Nuxt 4 which augments 'nitropack/types'.

describe('nitropack/types augmentations', () => {
  it('NitroRouteRules.robots accepts RobotsValue or indexable object', () => {
    expectTypeOf<NitroRouteRules['robots']>().toEqualTypeOf<RobotsValue | { indexable: boolean, rule: string } | undefined>()
  })

  it('NitroRouteConfig.robots accepts RobotsValue or indexable object', () => {
    expectTypeOf<NitroRouteConfig['robots']>().toEqualTypeOf<RobotsValue | { indexable: boolean, rule: string } | undefined>()
  })

  it('NitroRuntimeHooks has robots hooks', () => {
    expectTypeOf<NitroRuntimeHooks['robots:config']>()
      .toEqualTypeOf<(ctx: HookRobotsConfigContext) => void | Promise<void>>()
    expectTypeOf<NitroRuntimeHooks['robots:robots-txt']>()
      .toEqualTypeOf<(ctx: HookRobotsTxtContext) => void | Promise<void>>()
  })
})

// Regression test for https://github.com/nuxt-modules/robots/issues/294
// @nuxt/kit v4's extendRouteRules types NitroRouteConfig as
// `NitroV2.NitroRouteConfig | NitroV3.NitroRouteConfig`, pulling the interface
// through both 'nitropack' and 'nitropack/types'. If we only augment one path,
// the other re-exports the un-augmented interface and `robots` goes missing.
describe('nitropack augmentations (cross-module-path)', () => {
  it('NitroRouteConfig.robots is present on both nitropack and nitropack/types', () => {
    expectTypeOf<NitroRouteConfigPack['robots']>().toEqualTypeOf<RobotsValue | { indexable: boolean, rule: string } | undefined>()
  })

  it('NitroRouteRules.robots is present on both nitropack and nitropack/types', () => {
    expectTypeOf<NitroRouteRulesPack['robots']>().toEqualTypeOf<RobotsValue | { indexable: boolean, rule: string } | undefined>()
  })

  // Reproduces the exact scenario reported in issue #294 — a consumer module
  // calling @nuxt/kit's extendRouteRules should still see native Nitro keys
  // (`ssr`) alongside our augmented `robots` key. Kit v4 unions NitroRouteConfig
  // across both 'nitropack' and 'nitropack/types', so the rule object must
  // satisfy both augmented interfaces.
  it('extendRouteRules accepts ssr and robots together', () => {
    // Type-level only; never invoked. Before the fix, this call failed with
    // "Object literal may only specify known properties, and 'ssr' does not
    // exist in type 'NitroRouteConfig'." because our augmentation clobbered
    // only one of the two module paths kit v4 unions across.
    void (() => extendRouteRules('/example', {
      ssr: false,
      robots: false,
    }))
    expectTypeOf<NitroRouteConfig>().toExtend<{ ssr?: boolean, robots?: RobotsValue | { indexable: boolean, rule: string } }>()
    expectTypeOf<NitroRouteConfigPack>().toExtend<{ ssr?: boolean, robots?: RobotsValue | { indexable: boolean, rule: string } }>()
  })
})

// Regression test for https://github.com/nuxt-modules/robots/issues/299
// `nuxt.config.ts` routeRules are typed via `NuxtConfig['routeRules']`,
// which (in Nuxt 4) resolves NitroRouteConfig through 'nitropack/types'.
// If only 'nitropack' is augmented, declaring `robots` in routeRules fails
// with TS2353 "Object literal may only specify known properties".
describe('NuxtConfig routeRules (issue #299)', () => {
  it('NuxtConfig.routeRules accepts a robots-tagged literal', () => {
    expectTypeOf<{ '/admin': { robots: false } }>().toExtend<NonNullable<NuxtConfig['routeRules']>>()
    expectTypeOf<{ '/private': { robots: 'noindex, nofollow' } }>().toExtend<NonNullable<NuxtConfig['routeRules']>>()
    expectTypeOf<{ '/legacy': { robots: { indexable: false, rule: 'noindex' } } }>().toExtend<NonNullable<NuxtConfig['routeRules']>>()
  })
})

describe('h3 augmentations', () => {
  it('H3EventContext.robots is RobotsContext', () => {
    expectTypeOf<H3EventContext['robots']>().toEqualTypeOf<RobotsContext>()
  })

  it('H3EventContext.robotsProduction is optional RobotsContext', () => {
    expectTypeOf<H3EventContext['robotsProduction']>().toEqualTypeOf<RobotsContext | undefined>()
  })
})

describe('#app augmentations', () => {
  it('PageMeta.robots is optional RobotsValue', () => {
    expectTypeOf<PageMeta['robots']>().toEqualTypeOf<RobotsValue | undefined>()
  })
})
