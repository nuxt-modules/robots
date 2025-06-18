import { defineNuxtPlugin, useRequestEvent } from 'nuxt/app'
import { useBotDetection } from '../composables/useBotDetection'

export default defineNuxtPlugin({
  setup() {
    const botContextState = useBotDetection()
    
    if (import.meta.server) {
      const event = useRequestEvent()
      const headers = event?.node.req.headers || {}
      
      // Simple client-side accessible bot detection
      // This will be hydrated on the client
      botContextState.value = {
        isBot: false, // Default to false, real detection happens elsewhere
        userAgent: headers['user-agent'] || '',
        headers: {
          accept: headers.accept,
          acceptLanguage: headers['accept-language'],
          acceptEncoding: headers['accept-encoding']
        }
      }
    }
  },
})