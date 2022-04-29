import { existsSync, writeFileSync } from 'fs'
import { defineNuxtModule, addTemplate, addServerMiddleware, createResolver } from '@nuxt/kit'
import { genArrayFromRaw } from 'knitwork'
import { resolve } from 'pathe'
import { name, version } from '../package.json'
import { Rule } from './types'
import { getRules, render } from './utils'

// TODO: Remove function type `(() => Rule | Rule[])` when merged https://github.com/nuxt/framework/pull/4476
export type ModuleOptions = Rule | Rule[] | (() => Rule | Rule[])

export interface ModuleHooks {
  'robots:generate:before': (moduleOptions: ModuleOptions) => void
  'robots:generate:done': (content: string) => void
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'robots'
  },

  // TODO: remove doube quotes when merged https://github.com/unjs/knitwork/pull/9
  defaults: {
    UserAgent: '"*"',
    Disallow: '""'
  },

  setup (options, nuxt) {
    // TODO: use robots.txt in public fodler?
    const staticFilePath = resolve(nuxt.options.srcDir, nuxt.options.dir.public, 'robots.txt')

    if (existsSync(staticFilePath)) {
      return
    }

    const rules = (Array.isArray(options) ? options : [options]) as Rule[]

    // Generate robots.txt
    nuxt.hook('generate:done', async () => {
      // @ts-ignore
      await nuxt.callHook('robots:generate:before', rules)

      const generateFilePath = resolve(nuxt.options.rootDir, nuxt.options.generate.dir, 'robots.txt')
      const content = render(await getRules(rules))

      writeFileSync(generateFilePath, content)

      // @ts-ignore
      await nuxt.callHook('robots:generate:done', content)
    })

    // Inject options via virtual template
    nuxt.options.alias['#robots-options'] = addTemplate({
      filename: 'robots-options.mjs',
      write: true,
      getContents: () => [
        // TODO: use `genObjectFromValues` when merged https://github.com/unjs/knitwork/pull/9
        `export const options = ${genArrayFromRaw(rules)}`,
        `export const getRules = ${getRules.toString()}`,
        `export const render = ${render.toString()}`
      ].join('\n')
    }).dst

    // Transpile runtime
    const resolver = createResolver(import.meta.url)
    const runtimeDir = resolver.resolve('./runtime')
    nuxt.options.build.transpile.push(runtimeDir)

    // Middleware /robots.txt
    addServerMiddleware({
      route: '/robots.txt',
      handler: resolve(runtimeDir, 'server/middleware')
    })
  }
})
