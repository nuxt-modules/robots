import Robots from '../../../src/module'

export default defineNuxtConfig({
  modules: [Robots],
  site: { url: 'https://example.com' },
  robots: { debug: true, disallowNonIndexableRoutes: true },
  routeRules: { '/authored': { robots: true }, '/secret/**': { robots: false }, '/ai': { robots: { index: true, noai: true } } },
})
