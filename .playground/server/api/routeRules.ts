import { eventHandler } from '#imports'

export default eventHandler((e) => {
  // used to test route rules
  return e.context._nitro.routeRules
})
