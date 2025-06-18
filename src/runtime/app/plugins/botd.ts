import { defineNuxtPlugin } from 'nuxt/app'
import { useBotDetection } from '../composables/useBotDetection'

export default defineNuxtPlugin({
  setup() {
    // Initialize bot detection - this triggers server-side detection
    // when the composable is first called anywhere in the app
    useBotDetection()
  },
})
