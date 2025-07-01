import type { MaybeRef } from 'vue'
import type { UseBotDetectionOptions, UseBotDetectionReturn } from '../../types'
import { computed, ref } from 'vue'

// eslint-disable-next-line unused-imports/no-unused-vars
export function useRobotsRule(rule?: MaybeRef<boolean | string>) {
  return ref('')
}

export function useBotDetection(_options?: UseBotDetectionOptions): UseBotDetectionReturn {
  return {
    isBot: computed(() => false),
    botName: computed(() => undefined),
    botCategory: computed(() => undefined),
    trusted: computed(() => undefined),
    reset: () => {},
  }
}
