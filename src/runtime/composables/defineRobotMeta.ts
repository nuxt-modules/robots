import { useNuxtApp, useRuntimeConfig, useServerHead } from '#imports'

export function defineRobotMeta() {
  if (process.server) {
    const nuxtApp = useNuxtApp()
    const { indexable, robotsDisabledValue, robotsEnabledValue } = useRuntimeConfig().public['nuxt-simple-robots']
    useServerHead({
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
    })
  }
}
