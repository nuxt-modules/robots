import {
  useRequestEvent,
  useRuntimeConfig,
  useServerHead,
} from '#imports'
import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin({
  setup() {
    const event = useRequestEvent()
    const ctx = event?.context?.robots
    // set from nitro, not available for internal routes
    if (!ctx)
      return
    const config = useRuntimeConfig()

    useServerHead({
      meta: [
        {
          'name': 'robots',
          'content': () => ctx.rule || '',
          'data-hint': () => config['nuxt-robots']?.debug ? ctx.debug?.source : undefined,
        },
      ],
    })
  },
})
