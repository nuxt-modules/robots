import { indexableFromGroup } from '../../util'
import {
  defineNuxtPlugin,
  useNuxtApp,
  useRoute,
  useRuntimeConfig,
  useServerHead,
  useSiteConfig,
} from '#imports'

export default defineNuxtPlugin({
  setup() {
    const nuxtApp = useNuxtApp()
    const path = useRoute().path
    const { indexable } = useSiteConfig()
    const { robotsDisabledValue, robotsEnabledValue, groups } = useRuntimeConfig()['nuxt-simple-robots']
    // check if the route exist within any of the disallow groups and not within the allow of the same stack
    const groupIndexable = indexableFromGroup(groups, path)
    useServerHead({
      meta: [
        {
          'data-hint': import.meta.dev ? 'disabled in development' : undefined,
          'name': 'robots',
          'content': () => {
            // SSR only
            const routeRules = nuxtApp?.ssrContext?.event?.context?._nitro?.routeRules
            if (typeof routeRules.robots === 'string')
              return routeRules.robots
            if (indexable === false || routeRules?.index === false)
              return robotsDisabledValue
            return groupIndexable ? robotsEnabledValue : robotsDisabledValue
          },
        },
      ],
    })
  },
})
