import { useHead } from '#imports'
import { defineNuxtPlugin, useRequestEvent } from 'nuxt/app'

export default defineNuxtPlugin({
  setup() {
    const event = useRequestEvent()
    const ctx = event?.context?.robots
    const productionCtx = event?.context?.robotsProduction
    // set from nitro, not available for internal routes
    if (!ctx)
      return
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
