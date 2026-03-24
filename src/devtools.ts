import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { ModuleOptions } from './module'
import { setupDevToolsUI as _setupDevToolsUI } from 'nuxtseo-shared/devtools'

export function setupDevToolsUI(_options: ModuleOptions, resolve: Resolver['resolve'], nuxt?: Nuxt) {
  _setupDevToolsUI({ route: '/__nuxt-robots', name: 'nuxt-robots', title: 'Robots', icon: 'carbon:bot' }, resolve, nuxt)
}
