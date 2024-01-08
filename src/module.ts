import fsp from 'node:fs/promises'
import {
  addComponent,
  addImports,
  addPlugin,
  addServerHandler,
  addServerPlugin,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
  useLogger,
} from '@nuxt/kit'
import { defu } from 'defu'
import { installNuxtSiteConfig, updateSiteConfig } from 'nuxt-site-config-kit'
import { relative } from 'pathe'
import type { Preset } from 'unimport'
import { version } from '../package.json'
import { asArray, indexableFromGroup, normaliseRobotsRouteRule, parseRobotsTxt, validateRobots } from './runtime/util'
import { extendTypes, isNuxtGenerate } from './kit'
import type { Arrayable, RobotsGroupInput, RobotsGroupResolved } from './runtime/types'
import { NonHelpfulBots } from './const'
import { resolveI18nConfig, splitPathForI18nLocales } from './i18n'
import { setupDevToolsUI } from './devtools'

export interface ModuleOptions {
  /**
   * Whether the robots.txt should be generated.
   *
   * @default true
   */
  enabled: boolean
  /**
   * Should a `<meta name="robots" content="<>">` tag be added to the head.
   *
   * @default true
   */
  metaTag: boolean
  /**
   * Path to the sitemaps, if it exists.
   * Will automatically be resolved as an absolute path.
   *
   * @default []
   */
  sitemap: Arrayable<string>
  /**
   * Paths to add to the robots.txt with the allow keyword.
   *
   * @default []
   */
  allow: Arrayable<string>
  /**
   * Paths to add to the robots.txt with the disallow keyword.
   *
   * @default []
   */
  disallow: Arrayable<string>
  /**
   * Define more granular rules for the robots.txt. Each stack is a set of rules for specific user agent(s).
   *
   * @default []
   * @example [
   *    {
   *    userAgents: ['AdsBot-Google-Mobile', 'AdsBot-Google-Mobile-Apps'],
   *    disallow: ['/admin'],
   *    allow: ['/admin/login'],
   *    },
   *  ]
   */
  groups: RobotsGroupInput[]
  /**
   * The value to use when the site is indexable.
   *
   * @default 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
   */
  robotsEnabledValue: string
  /**
   * The value to use when the site is not indexable.
   *
   * @default 'noindex, nofollow'
   */
  robotsDisabledValue: string
  /**
   * Should route rules which disallow indexing be added to the `/robots.txt` file.
   *
   * @default true
   */
  disallowNonIndexableRoutes: boolean
  /**
   * Specify a robots.txt path to merge the config from, relative to the root directory.
   *
   * When set to `true`, the default path of `<publicDir>/robots.txt` will be used.
   *
   * When set to `false`, no merging will occur.
   *
   * @default true
   */
  mergeWithRobotsTxtPath: boolean | string
  /**
   * Blocks bots that don't benefit our SEO and are known to cause issues.
   *
   * @default false
   */
  blockNonSeoBots: boolean
  /**
   * Enables debug logs and a debug endpoint.
   *
   * @default false
   */
  debug: boolean
  /**
   * Should the robots.txt display credits for the module.
   *
   * @default true
   */
  credits: boolean
}

export interface ResolvedModuleOptions extends ModuleOptions {
  sitemap: string[]
  disallow: string[]
}

export interface ModuleHooks {
  'robots:config': (config: ResolvedModuleOptions) => Promise<void> | void
}

export interface ModulePublicRuntimeConfig {
  ['nuxt-simple-robots']: ResolvedModuleOptions
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-simple-robots',
    compatibility: {
      nuxt: '^3.6.1',
      bridge: false,
    },
    configKey: 'robots',
  },
  defaults: {
    enabled: true,
    credits: true,
    debug: false,
    allow: [],
    disallow: [],
    sitemap: [],
    groups: [],
    blockNonSeoBots: false,
    mergeWithRobotsTxtPath: true,
    metaTag: true,
    robotsEnabledValue: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    robotsDisabledValue: 'noindex, nofollow',
    disallowNonIndexableRoutes: true,
  },
  async setup(config, nuxt) {
    const logger = useLogger('nuxt-simple-robots')
    logger.level = (config.debug || nuxt.options.debug) ? 4 : 3
    if (config.enabled === false) {
      logger.debug('The module is disabled, skipping setup.')
      return
    }

    const resolvedAutoI18n = await resolveI18nConfig(logger)

    if (config.blockNonSeoBots) {
      // credits to yoast.com/robots.txt
      config.groups.push({
        userAgent: NonHelpfulBots,
        comment: ['Block bots that don\'t benefit us.'],
        disallow: ['/'],
      })
    }

    const { resolve } = createResolver(import.meta.url)

    await installNuxtSiteConfig()

    if (config.metaTag)
      addPlugin({ mode: 'server', src: resolve('./runtime/nuxt/plugins/robot-meta.server') })

    if (config.mergeWithRobotsTxtPath !== false) {
      let usingRobotsTxtPath = ''
      let robotsTxt: boolean | string = false
      const publicRobotsTxtPath = resolve(nuxt.options.rootDir, nuxt.options.dir.public, 'robots.txt')
      const validPaths = [
        // public/robots.txt - This is the default, we need to move this to avoid issues
        publicRobotsTxtPath,
        // assets/robots.txt
        resolve(nuxt.options.rootDir, nuxt.options.dir.assets, 'robots.txt'),
        // public/_robots.txt
        resolve(nuxt.options.rootDir, nuxt.options.dir.public, '_robots.txt'),
        // public/_dir/robots.txt
        resolve(nuxt.options.rootDir, nuxt.options.dir.public, '_dir', 'robots.txt'),
        // pages/_dir/robots.txt
        resolve(nuxt.options.rootDir, nuxt.options.dir.pages, '_dir', 'robots.txt'),
        // pages/robots.txt
        resolve(nuxt.options.rootDir, nuxt.options.dir.pages, 'robots.txt'),
        // robots.txt
        resolve(nuxt.options.rootDir, 'robots.txt'),
      ]
      // we're going to check if a robots.txt is present, if so we can disable this module by default
      if (config.mergeWithRobotsTxtPath === true) {
        for (const path of validPaths) {
          robotsTxt = await fsp.readFile(path, { encoding: 'utf-8' }).catch(() => false)
          if (robotsTxt) {
            usingRobotsTxtPath = path
            break
          }
        }
      }
      else {
        const customPath = resolve(nuxt.options.rootDir, config.mergeWithRobotsTxtPath)
        if (!(await fsp.stat(customPath).catch(() => false))) {
          logger.error(`You provided an invalid \`mergeWithRobotsTxtPath\`, the file does not exist: ${customPath}.`)
        }
        else {
          usingRobotsTxtPath = customPath
          robotsTxt = await fsp.readFile(customPath, { encoding: 'utf-8' })
        }
      }
      if (typeof robotsTxt === 'string') {
        const path = relative(nuxt.options.rootDir, usingRobotsTxtPath)
        logger.debug(`A robots.txt file was found at \`./${path}\`, merging config.`)
        const parsedRobotsTxt = parseRobotsTxt(robotsTxt)
        const errors = validateRobots(parsedRobotsTxt)
        if (errors.length > 0) {
          logger.error(`The \`./${path}\` file contains errors:`)
          for (const error of errors)
            logger.log(` - ${error}`)
          logger.log('')
        }
        // check if the robots.txt is blocking indexing
        const wildCardGroups = parsedRobotsTxt.groups.filter((group: any) => asArray(group.userAgent).includes('*'))
        if (wildCardGroups.some((group: any) => asArray(group.disallow).includes('/'))) {
          logger.warn(`The \`./${path}\` is blocking indexing for all environments.`)
          logger.info('It\'s recommended to use the \`indexable\` Site Config to toggle this instead.')
        }
        config.groups.push(...parsedRobotsTxt.groups)
        const host = parsedRobotsTxt.groups.map(g => g.host).filter(Boolean)[0]
        if (host) {
          updateSiteConfig({
            _context: usingRobotsTxtPath,
            url: host,
          })
        }
        // merge in with config
        config.sitemap = [...new Set([...asArray(config.sitemap), ...parsedRobotsTxt.sitemaps])]
        if (usingRobotsTxtPath === publicRobotsTxtPath) {
          // we need to move their robots.txt to _robots.txt
          await fsp.rename(usingRobotsTxtPath, resolve(nuxt.options.rootDir, nuxt.options.dir.public, '_robots.txt'))
          logger.warn('Your robots.txt file was moved to `./public/_robots.txt` to avoid conflicts.')
          const extraPaths: string[] = []
          // use validPaths
          for (const path of validPaths) {
            if (path !== usingRobotsTxtPath)
              extraPaths.push(` - ./${relative(nuxt.options.rootDir, path)}`)
          }
          logger.info(`The following paths are also valid for your robots.txt:\n${extraPaths.join('\n')}\n`)
        }
      }
    }

    nuxt.hook('modules:done', async () => {
      config.sitemap = asArray(config.sitemap)
      config.disallow = asArray(config.disallow)
      config.allow = asArray(config.allow)
      // make sure any groups have a user agent, if not we set it to *
      config.groups = config.groups.map((group) => {
        group.userAgent = group.userAgent ? asArray(group.userAgent) : ['*']
        group.disallow = asArray(group.disallow)
        group.allow = asArray(group.allow)
        return group
      })
      // find an existing stack with a user agent that is equal to "['*']"
      const existingGroup = (config.groups as RobotsGroupResolved[]).find(stack => stack.userAgent.length === 1 && stack.userAgent[0] === '*')
      if (existingGroup) {
        // we'll just add the disallow, allow to the existing stack
        existingGroup.disallow = [...new Set([...(existingGroup.disallow || []), ...config.disallow])]
        if (existingGroup.disallow.length > 1) {
          // remove any empty disallows
          existingGroup.disallow = existingGroup.disallow.filter(disallow => disallow !== '')
        }
        existingGroup.allow = [...new Set([...(existingGroup.allow || []), ...config.allow])]
      }
      else {
        // otherwise make a new stack
        config.groups.unshift(<RobotsGroupResolved>{
          userAgent: ['*'],
          disallow: config.disallow.length > 0 ? config.disallow : [''],
          allow: config.allow,
        })
      }

      // @ts-expect-error runtime type
      await nuxt.hooks.callHook('robots:config', config)

      nuxt.options.routeRules = nuxt.options.routeRules || {}
      // convert robot routeRules to header routeRules for static hosting
      Object.entries(nuxt.options.routeRules).forEach(([route, rules]) => {
        const groupIndexable = indexableFromGroup(config.groups, route)
        const robotRules = normaliseRobotsRouteRule(rules, groupIndexable, config.robotsDisabledValue, config.robotsEnabledValue)
        // single * is supported but ignored
        // @ts-expect-error untyped
        nuxt.options.routeRules[route] = defu({
          headers: {
            'X-Robots-Tag': robotRules.rule,
          },
        }, nuxt.options.routeRules?.[route])
      })

      const extraDisallows = new Set<string>()
      if (config.disallowNonIndexableRoutes) {
        // iterate the route rules and add any non indexable rules to disallow
        Object.entries(nuxt.options.routeRules || {}).forEach(([route, rules]) => {
          const groupIndexable = indexableFromGroup(config.groups, route)
          const { indexable } = normaliseRobotsRouteRule(rules, groupIndexable, config.robotsDisabledValue, config.robotsEnabledValue)
          if (!indexable) {
            // single * is supported but ignored
            extraDisallows.add(route.replaceAll('**', '*'))
          }
        })
      }
      // merge into first group with wildcard user agent
      const firstGroup = (config.groups as RobotsGroupResolved[]).find(group => group.userAgent.includes('*'))
      if (firstGroup)
        firstGroup.disallow = [...new Set([...(firstGroup.disallow || []), ...extraDisallows])]

      if (resolvedAutoI18n && resolvedAutoI18n.locales && resolvedAutoI18n.strategy !== 'no_prefix') {
        const i18n = resolvedAutoI18n
        for (const group of config.groups) {
          group.allow = asArray(group.allow || []).map(path => splitPathForI18nLocales(path, i18n)).flat()
          group.disallow = asArray(group.disallow || []).map(path => splitPathForI18nLocales(path, i18n)).flat()
        }
      }

      nuxt.options.runtimeConfig['nuxt-simple-robots'] = {
        version,
        usingNuxtContent: hasNuxtModule('@nuxt/content'),
        debug: config.debug,
        credits: config.credits,
        groups: config.groups,
        sitemap: config.sitemap,
        robotsEnabledValue: config.robotsEnabledValue,
        robotsDisabledValue: config.robotsDisabledValue,
      }
    })

    extendTypes('nuxt-simple-robots', ({ typesPath }) => {
      return `
declare module 'nitropack' {
  interface NitroApp {
    _robots: {
      ctx: import('${typesPath}').HookRobotsConfigContext
      nuxtContentUrls: Set<string>
    }
  }
  interface NitroRouteRules {
    /**
     * @deprecated Use \`robots: <boolean>\` instead.
     */
    index?: boolean
    robots?: boolean | string | {
      indexable: boolean
      rule: string
    }
  }
  interface NitroRouteConfig {
    /**
     * @deprecated Use \`robots: <boolean>\` instead.
     */
    index?: boolean
    robots?: boolean | string | {
      indexable: boolean
      rule: string
    }
  }
  interface NitroRuntimeHooks {
    'robots:config': (ctx: import('${typesPath}').HookRobotsConfigContext) => void | Promise<void>
    'robots:robots-txt': (ctx: import('${typesPath}').HookRobotsTxtContext) => void | Promise<void>
  }
}
declare module 'h3' {
  interface H3EventContext {
    robots: {
      rule: string
      indexable: boolean
    }
  }
}
`
    })

    // only prerender for `nuxi generate`
    if (isNuxtGenerate()) {
      nuxt.options.generate = nuxt.options.generate || {}
      nuxt.options.generate.routes = asArray(nuxt.options.generate.routes || [])
      nuxt.options.generate.routes.push('/robots.txt')
    }

    // defineRobotMeta is a server-only composable
    nuxt.options.optimization.treeShake.composables.client['nuxt-simple-robots'] = ['defineRobotMeta']

    addImports({
      name: 'defineRobotMeta',
      from: resolve('./runtime/nuxt/composables/defineRobotMeta'),
    })

    addComponent({
      name: 'RobotMeta',
      filePath: resolve('./runtime/nuxt/components/RobotMeta'),
    })

    // add robots.txt server handler
    addServerHandler({
      route: '/robots.txt',
      handler: resolve('./runtime/nitro/server/robots-txt'),
    })
    // add robots HTTP header handler
    addServerHandler({
      handler: resolve('./runtime/nitro/server/middleware'),
    })
    addServerPlugin(resolve('./runtime/nitro/plugins/initContext'))

    if (hasNuxtModule('@nuxt/content')) {
      addServerHandler({
        route: '/__robots__/nuxt-content.json',
        handler: resolve('./runtime/nitro/server/__robots__/nuxt-content'),
      })
    }

    if (config.debug || nuxt.options.dev) {
      addServerHandler({
        route: '/__robots__/debug.json',
        handler: resolve('./runtime/nitro/server/__robots__/debug'),
      })
      addServerHandler({
        route: '/__robots__/debug-path.json',
        handler: resolve('./runtime/nitro/server/__robots__/debug-path'),
      })
    }

    if (nuxt.options.dev)
      setupDevToolsUI(config, resolve)

    const siteConfigPreset: Preset = {
      from: '#internal/nuxt-simple-robots',
      imports: [
        'getPathRobotConfig',
        'getSiteRobotConfig',
      ],
    }
    nuxt.options.nitro = nuxt.options.nitro || {}
    nuxt.options.nitro.imports = nuxt.options.nitro.imports || {}
    nuxt.options.nitro.imports.presets = nuxt.options.nitro.imports.presets || []
    nuxt.options.nitro.imports.presets.push(siteConfigPreset)
    nuxt.options.nitro.alias = nuxt.options.nitro.alias || {}
    nuxt.options.nitro.alias['#internal/nuxt-simple-robots'] = resolve('./runtime/nitro/composables')
  },
})
