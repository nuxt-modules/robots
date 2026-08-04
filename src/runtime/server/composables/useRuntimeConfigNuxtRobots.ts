import type { H3Event } from '#nuxtseo/h3'
import type { NuxtRobotsRuntimeConfig } from '../../types'
import { useRuntimeConfig } from '#nuxtseo/nitro'

export function useRuntimeConfigNuxtRobots(event?: H3Event): NuxtRobotsRuntimeConfig {
  return useRuntimeConfig(event)['nuxt-robots'] as NuxtRobotsRuntimeConfig
}
