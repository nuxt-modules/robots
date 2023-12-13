import {
  defineNuxtPlugin,
  useRequestEvent,
  useServerHead,
} from '#imports'

export default defineNuxtPlugin({
  setup() {
    const event = useRequestEvent()
    useServerHead({
      meta: [
        {
          'name': 'robots',
          'content': () => event.context.robots?.rule || '',
          'data-hint': (import.meta.dev && !event.context.robots.indexable) ? 'disabled in development' : undefined,
        },
      ],
    })
  },
})
