// `isBot` is resolved by the Nitro auto-import registry: with `botDetection: false`
// it must come from the module's mock-composables and always report false.
import { defineEventHandler } from 'h3'

export default defineEventHandler(e => {
  return {
    isBot: isBot(e),
  }
})
