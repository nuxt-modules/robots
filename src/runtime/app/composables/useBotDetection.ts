import { useState } from 'nuxt/app'

export function useBotDetection() {
  return useState('botContext', () => null)
}
