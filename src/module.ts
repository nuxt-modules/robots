import type { Module } from '@nuxt/types'
import { name, version } from '../package.json'
import { build } from './build'
import { generate } from './generate'
import { middleware } from './middleware'
import { Rule } from './types'

const CONFIG_KEY = 'robots'

export type { Rule }

export type ModuleOptions = Rule | Rule[] | (() => Rule | Rule[])

async function getOptions (moduleOptions: ModuleOptions): Promise<Rule[]> {
  if (typeof moduleOptions === 'function') {
    moduleOptions = await moduleOptions.call(this)
  }

  if (Array.isArray(moduleOptions)) {
    return moduleOptions
  }

  let { robots } = this.options

  if (typeof robots === 'function') {
    robots = await robots.call(this)
  }

  if (Array.isArray(robots)) {
    return robots
  }

  return [{
    UserAgent: '*',
    Disallow: '',
    ...robots,
    ...moduleOptions
  }]
}

const nuxtModule: Module<ModuleOptions> = async function (moduleOptions) {
  const options: Rule[] = await getOptions.call(this, moduleOptions)

  build.bind(this)()
  generate.bind(this)(options)
  middleware.bind(this)(options)
}

;(nuxtModule as any).meta = { name, version }

declare module '@nuxt/types' {
  interface NuxtConfig { [CONFIG_KEY]?: ModuleOptions } // Nuxt 2.14+
  interface Configuration { [CONFIG_KEY]?: ModuleOptions } // Nuxt 2.9 - 2.13
}

export default nuxtModule
