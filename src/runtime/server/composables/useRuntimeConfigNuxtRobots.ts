import type { RequestEvent } from 'nuxt/server'
import type { NuxtRobotsRuntimeConfig } from '../../types'
import { useRuntimeConfig } from 'nuxt/server'

export function useRuntimeConfigNuxtRobots(_event?: Pick<RequestEvent, 'context'>): NuxtRobotsRuntimeConfig {
  return useRuntimeConfig()['nuxt-robots'] as NuxtRobotsRuntimeConfig
}
