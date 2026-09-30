import NuxtRobots from '@nuxtjs/robots'

export default defineNuxtConfig({
  workspaceDir: import.meta.dirname,
  modules: [NuxtRobots],
  site: { url: 'https://nuxt3.example.com' },
  robots: { credits: false },
  compatibilityDate: '2024-08-29',
})
