import type { PageMeta } from '#app'
import type {
  HookRobotsConfigContext,
  HookRobotsTxtContext,
  RobotsContext,
  RobotsValue,
} from '@nuxtjs/robots'
import type { H3EventContext } from 'h3'
import type { NitroRouteConfig, NitroRouteRules, NitroRuntimeHooks } from 'nitropack/types'
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
