import { useHead } from '#imports'
import { defineNuxtPlugin, useRequestEvent, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtPlugin({
  setup() {
    const event = useRequestEvent()
    const ctx = event?.context?.robots
    // set from nitro, not available for internal routes
    if (!ctx)
      return
    const config = useRuntimeConfig()

    useHead({
      meta: [
        {
          'name': 'robots',
          'content': () => ctx.rule || '',
          'data-hint': () => config['nuxt-robots']?.debug && ctx.debug?.source ? `${ctx.debug?.source},${ctx.debug?.line}` : undefined,
        },
      ],
    })
  },
})
