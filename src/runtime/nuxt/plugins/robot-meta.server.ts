import { defineNuxtPlugin } from 'nuxt/app'
import {
  useRequestEvent,
  useServerHead,
} from '#imports'

export default defineNuxtPlugin({
  setup() {
    const event = useRequestEvent()
    const ctx = event?.context?.robots
    // set from nitro, not available for internal routes
    if (!ctx)
      return
    useServerHead({
      meta: [
        {
          'name': 'robots',
          'content': () => ctx.rule || '',
          'data-hint': (import.meta.dev && !ctx.indexable) ? 'disabled in development' : undefined,
        },
      ],
    })
  },
})
