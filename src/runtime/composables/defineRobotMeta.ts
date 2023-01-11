import { useServerHead } from '@vueuse/head'
// eslint-disable-next-line import/default
import config from '#nuxt-simple-robots/config'
import { useNuxtApp } from '#imports'

export function defineRobotMeta() {
  if (process.server) {
    const nuxtApp = useNuxtApp()
    useServerHead({
      meta: [
        {
          name: 'robots',
          content: () => {
            // SSR only
            const routeRules = nuxtApp?.ssrContext?.event?.context?._nitro?.routeRules
            const key = (config.indexable === false || routeRules?.index === false) ? 'robotsDisabledValue' : 'robotsEnabledValue' as const
            return config[key]
          },
        },
      ],
    })
  }
}
