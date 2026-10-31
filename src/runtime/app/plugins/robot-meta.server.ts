import type { NuxtRobotsRuntimeConfig } from '../../types'
import { defineNuxtPlugin, useHead, useRequestEvent, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtPlugin({
  setup(nuxtApp) {
    const event = useRequestEvent()
    const ctx = event?.context?.robots
    const productionCtx = event?.context?.robotsProduction
    // set from nitro, not available for internal routes
    if (!ctx || !event)
      return
    const prerenderedNotFound = import.meta.prerender && event.path === '/404.html'
    const { robotsDisabledValue } = useRuntimeConfig()['nuxt-robots'] as NuxtRobotsRuntimeConfig
    if (prerenderedNotFound) {
      ctx.rule = robotsDisabledValue
      ctx.indexable = false
    }
    if (import.meta.prerender) {
      nuxtApp.ssrContext?.head.hooks?.hook('tags:afterResolve', ({ tags }) => {
        for (const tag of tags) {
          if (tag.tag !== 'meta' || tag.props.name !== 'robots')
            continue
          // Error-page metadata must not make the static 404 fallback indexable.
          if (prerenderedNotFound)
            tag.props.content = robotsDisabledValue
          event.context.robotsMetaRendered = true
        }
      })
    }
    useHead({
      meta: [
        {
          'name': 'robots',
          'content': () => ctx.rule || '',
          'data-hint': () => import.meta.dev && ctx.debug?.source ? [ctx.debug?.source, ctx.debug?.line].filter(Boolean).join(',') : undefined,
          'data-production-content': () => import.meta.dev && productionCtx?.rule ? productionCtx.rule : undefined,
        },
      ],
    })
  },
})
