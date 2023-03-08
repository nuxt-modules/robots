import { indexable, robotsDisabledValue, robotsEnabledValue } from '#nuxt-simple-robots/config'
import { useHead, useNuxtApp } from '#imports'

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
            if (typeof routeRules.robots === 'string')
              return routeRules.robots
            return (indexable === false || routeRules?.index === false) ? robotsDisabledValue : robotsEnabledValue
          },
        },
      ],
    }, { mode: 'server' })
  }
}
