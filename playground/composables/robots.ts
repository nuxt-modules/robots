import { useRobotsRule } from '#robots/app/composables/useRobotsRule'

export function disableIndexing() {
  return useRobotsRule(false)
}
