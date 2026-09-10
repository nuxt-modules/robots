import NuxtRobots from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
  ],
  robots: {
    botDetection: false,
  },
  // this repo's .nuxtrc disables nitro auto-imports; opt back in so the server
  // route exercises the module's auto-import registrations like a user app would
  imports: {
    autoImport: true,
  },
  site: {
    url: 'https://nuxtseo.com',
  },
})
