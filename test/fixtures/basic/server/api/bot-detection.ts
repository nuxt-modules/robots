import { getBotDetection } from '#robots/server/composables/getBotDetection'
import { defineEventHandler } from 'h3'

export default defineEventHandler((e) => {
  return getBotDetection(e)
})
