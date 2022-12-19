import config from '#nuxt-simple-robots/config'
import { useNuxtApp } from '#imports'

export function defineRobotMeta() {
  if (process.server) {
    const nuxtApp = useNuxtApp()
    useHead({
      meta: [
        {
          name: 'robots',
          content: () => {
            // SSR only
            const routeRules = nuxtApp?.ssrContext?.event?.context?._nitro?.routeRules
            return config[(config.indexable === false || routeRules?.index === false) ? 'robotsDisabledValue' : 'robotsEnabledValue']
          },
        },
      ],
    })
  }
}
