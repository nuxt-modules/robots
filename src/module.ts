import { existsSync } from 'node:fs'
import { defineNuxtModule, addServerHandler, createResolver, useLogger, isNuxt2, findPath, addTemplate } from '@nuxt/kit'
import { name, version } from '../package.json'
import { Rule } from './types'

export type ModuleOptions = {
  configPath: string,
  rules: Rule | Rule[]
}

export interface ModuleHooks {
  'robots:generate:before': (rules: Rule | Rule[]) => void
  'robots:generate:done': (content: string) => void
}

const ROBOTS_FILENAME = 'robots.txt'
const logger = useLogger('nuxt:robots')

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'robots'
  },
  defaults: {
    configPath: 'robots.config',
    rules: {
      UserAgent: '*',
      Disallow: ''
    }
  },
  async setup (options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const staticFilePath = resolve(
      nuxt.options.srcDir,
      isNuxt2() ? nuxt.options.dir.static : nuxt.options.dir.public,
      ROBOTS_FILENAME
    )

    if (existsSync(staticFilePath)) {
      logger.warn('To use `' + name + ' module`, please remove public `robots.txt`')
      return
    }

    nuxt.options.alias['#robots-config'] = await findPath(options.configPath) ?? resolve('./robots.config')
    nuxt.options.alias['#robots-rules'] = addTemplate({
      filename: 'robots-rules.mjs',
      write: true,
      getContents: () => `export const rules = ${JSON.stringify(options.rules, null, 2)}`
    }).dst

    // Generate static robots.txt
    if (nuxt.options._generate) {
      nuxt.options.nitro = nuxt.options.nitro || {}
      nuxt.options.nitro.prerender = nuxt.options.nitro.prerender || {}
      nuxt.options.nitro.prerender.routes = nuxt.options.nitro.prerender.routes || []
      nuxt.options.nitro.prerender.routes.push(`/${ROBOTS_FILENAME}`)
    }

    // Transpile runtime
    const runtimeDir = resolve('./runtime')
    nuxt.options.build.transpile.push(runtimeDir)

    addServerHandler({
      route: `/${ROBOTS_FILENAME}`,
      handler: resolve(runtimeDir, 'server/middleware')
    })
  }
})
