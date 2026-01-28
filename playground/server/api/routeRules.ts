import { defineEventHandler } from 'h3'

export default defineEventHandler((e) => {
  // used to test route rules
  return e.context._nitro.routeRules
})
