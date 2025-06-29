import type { H3Event } from 'h3'
import type { NuxtRobotsRuntimeConfig } from '../../types'
import { useRuntimeConfig } from 'nitropack/runtime'

export function useRuntimeConfigNuxtRobots(event?: H3Event): NuxtRobotsRuntimeConfig {
  return useRuntimeConfig(event)['nuxt-robots'] as NuxtRobotsRuntimeConfig
}
