import { defineNuxtConfig } from 'nuxt/config'
import NuxtRobots from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtRobots],
  compatibilityDate: '2026-10-01',
  site: { url: 'https://example.com' },
})
