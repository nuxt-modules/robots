import { useServerHead } from '@vueuse/head'
import { indexable, robotsDisabledValue, robotsEnabledValue } from '#nuxt-simple-robots/config'
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
            return (indexable === false || routeRules?.index === false) ? robotsDisabledValue : robotsEnabledValue
          },
        },
      ],
    })
  }
}
