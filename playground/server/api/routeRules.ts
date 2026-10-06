import { defineEventHandler } from 'nuxt/server'

export default defineEventHandler((e) => {
  // used to test route rules
  return e.context._nitro.routeRules
})
