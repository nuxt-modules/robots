import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'pathe'
import { defineNuxtModule, isNuxt2 } from '@nuxt/kit'
import { name, version } from '../package.json'
import { Rule, RuleInterface } from './types'
import { getRules, parseFile, render } from './utils'

export type ModuleOptions = Rule | Rule[] | (() => Rule | Rule[])

export interface ModuleHooks {
  'robots:generate:before': (moduleOptions: ModuleOptions) => void
  'robots:generate:done': (content: string) => void
}

export default defineNuxtModule({
  meta: {
    name,
    version,
    configKey: 'robots'
  },

  setup (moduleOptions, nuxt) {
    if (!Array.isArray(moduleOptions)) {
      moduleOptions = [{
        UserAgent: '*',
        Disallow: '',
        ...moduleOptions
      }]
    }

    let staticRules: RuleInterface[] = []

    // Loading existing robots.txt
    nuxt.hook('build:before', async () => {
      const staticDir = isNuxt2() ? nuxt.options.dir.static : nuxt.options.dir.public
      const staticFilePath = resolve(nuxt.options.srcDir, staticDir, 'robots.txt')

      if (existsSync(staticFilePath)) {
        const content = readFileSync(staticFilePath).toString()

        staticRules = await getRules.call(nuxt, parseFile(content))
      }
    })

    // Generate robots.txt
    nuxt.hook('generate:done', async () => {
      // @ts-ignore
      await nuxt.callHook('robots:generate:before', moduleOptions)

      const generateFilePath = resolve(nuxt.options.rootDir, nuxt.options.generate.dir, 'robots.txt')
      const rules: RuleInterface[] = await getRules.call(nuxt, moduleOptions)
      const content = render([...staticRules, ...rules])

      writeFileSync(generateFilePath, content)

      // @ts-ignore
      await nuxt.callHook('robots:generate:done', content)
    })

    // Middleware /robots.txt
    nuxt.options.serverMiddleware.unshift({
      path: '/robots.txt',
      async handler (req, res) {
        const rules: RuleInterface[] = await getRules.call(nuxt, moduleOptions, req)

        res.setHeader('Content-Type', 'text/plain')
        res.end(render([...staticRules, ...rules]))
      }
    })
  }
})
