import { existsSync } from 'fs'
import { defineNuxtModule, addServerHandler, createResolver, useLogger, isNuxt2, findPath, addTemplate } from '@nuxt/kit'
import { name, version } from '../package.json'
import type { Rule } from './types'

export type ModuleOptions = {
  configPath: string,
  rules: Rule | Rule[]
}

const ROBOTS_FILENAME = 'robots.txt'
const logger = useLogger('nuxt:robots')

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'robots',
    compatibility: {
      bridge: true
    }
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
      logger.warn('To use `' + name + '` module, please remove public `robots.txt`')
      return
    }

    nuxt.options.alias['#robots'] = await findPath(options.configPath) ?? (addTemplate({
      filename: 'robots.mjs',
      write: true,
      getContents: () => `export default ${JSON.stringify(options.rules, null, 2)}`
    }).dst || '')

    nuxt.hook('nitro:build:before', (nitro) => {
      nitro.options.prerender.routes.push(`/${ROBOTS_FILENAME}`)
    })

    const runtimeDir = resolve('./runtime')
    nuxt.options.build.transpile.push(runtimeDir)

    addServerHandler({
      route: `/${ROBOTS_FILENAME}`,
      handler: resolve(runtimeDir, 'server/middleware')
    })
  }
})
