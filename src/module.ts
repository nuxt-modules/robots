import { pathExists, outputFile, remove } from 'fs-extra'
import { defineNuxtModule, addServerHandler, createResolver, useLogger, isNuxt2, findPath, resolvePath, tryRequireModule, addTemplate } from '@nuxt/kit'
import { name, version } from '../package.json'
import { Rule } from './types'
import { getRules, render } from './utils'

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

    if (await pathExists(staticFilePath)) {
      logger.warn('To use `' + name + ' module`, please remove public `robots.txt`')
      return
    }

    const configPath = await findPath(options.configPath) ?? resolve('./robots.config')
    const outputDir = await resolvePath('node_modules/.cache/nuxt-robots')

    nuxt.options.nitro = nuxt.options.nitro || {}
    nuxt.options.nitro.publicAssets = nuxt.options.nitro.publicAssets || []
    nuxt.options.nitro.publicAssets.push({ dir: outputDir })

    nuxt.options.alias['#robots-config'] = configPath
    nuxt.options.alias['#robots-rules'] = addTemplate({
      filename: 'robots-rules.mjs',
      write: true,
      getContents: () => `export const rules = ${JSON.stringify(options.rules, null, 2)}`
    }).dst

    // Generate static robots.txt
    nuxt.hook('build:done', async () => {
      if (!nuxt.options._generate) {
        await remove(resolve(outputDir, ROBOTS_FILENAME))
        return
      }

      const rules: Rule | Rule[] = tryRequireModule(configPath)
      await nuxt.callHook('robots:generate:before', rules)
      const content = render(await getRules(rules))
      await outputFile(resolve(outputDir, ROBOTS_FILENAME), content)
      await nuxt.callHook('robots:generate:done', content)
    })

    // Transpile runtime
    const runtimeDir = resolve('./runtime')
    nuxt.options.alias['#robots-config'] = configPath
    nuxt.options.build.transpile.push(runtimeDir)

    addServerHandler({
      route: `/${ROBOTS_FILENAME}`,
      handler: resolve(runtimeDir, 'server/middleware')
    })
  }
})
