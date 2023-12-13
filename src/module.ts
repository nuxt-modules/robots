import fsp from 'node:fs/promises'
import {
  addComponent,
  addImports,
  addPlugin,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  useLogger,
} from '@nuxt/kit'
import { defu } from 'defu'
import { installNuxtSiteConfig, updateSiteConfig } from 'nuxt-site-config-kit'
import { relative } from 'pathe'
import { asArray } from './runtime/util'
import { extendTypes } from './kit'
import { parseRobotsTxt } from './robotsTxtParser'
import type { Arrayable, RobotsGroupInput, RobotsGroupResolved } from './runtime/types'
import { NonHelpfulBots } from './const'

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
  /**
   * The url of your site.
   * Used to generate absolute URLs for the sitemap.
   *
   * Note: This is only required when prerendering your site.
   *
   * @deprecated Provide `url` through site config instead: `{ site: { url: <value> }}`.
   * This is powered by the `nuxt-site-config` module.
   * @see https://github.com/harlan-zw/nuxt-site-config
   */
  host?: string
  /**
   * The url of your site.
   * Used to generate absolute URLs for the sitemap.
   *
   * Note: This is only required when prerendering your site.
   *
   * @deprecated Provide `url` through site config instead: `{ site: { url: <value> }}`.
   * This is powered by the `nuxt-site-config` module.
   * @see https://github.com/harlan-zw/nuxt-site-config
   */
  siteUrl?: string
  /**
   * Can your site be crawled by search engines.
   *
   * @deprecated Provide `indexable` through site config instead: `{ site: { indexable: <value> }}`.
   * This is powered by the `nuxt-site-config` module.
   * @see https://github.com/harlan-zw/nuxt-site-config
   */
  indexable?: boolean
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
    // allow config fallback
    if (config.siteUrl || config.host!) {
      await updateSiteConfig({
        _context: 'nuxt-simple-robots:config',
        url: config.siteUrl,
        indexable: config.indexable,
      })
    }

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
        logger.debug(`A robots.txt file was found at \`./${relative(nuxt.options.rootDir, usingRobotsTxtPath)}\`, merging config.`)
        const { groups, sitemaps } = parseRobotsTxt(robotsTxt)
        config.groups.push(...groups)
        const host = groups.map(g => g.host).filter(Boolean)[0]
        if (host) {
          updateSiteConfig({
            _context: usingRobotsTxtPath,
            url: host,
          })
        }
        // merge in with config
        config.sitemap = [...new Set([...asArray(config.sitemap), ...sitemaps])]
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
      // @ts-expect-error runtime type
      await nuxt.hooks.callHook('robots:config', config)

      nuxt.options.routeRules = nuxt.options.routeRules || {}
      // convert robot routeRules to header routeRules for static hosting
      Object.entries(nuxt.options.routeRules).forEach(([route, rules]) => {
        if (rules.index === false || rules.robots) {
          // single * is supported but ignored
          // @ts-expect-error untyped
          nuxt.options.routeRules[route] = defu({
            headers: {
              'X-Robots-Tag': rules.index === false ? config.robotsDisabledValue : rules.robots,
            },
          }, nuxt.options.routeRules?.[route])
        }
      })

      const disallow = config.disallow
      if (config.disallowNonIndexableRoutes) {
        // iterate the route rules and add any non indexable rules to disallow
        Object.entries(nuxt.options.routeRules || {}).forEach(([route, rules]) => {
          if (rules.index === false || rules.robots?.includes('noindex')) {
            // single * is supported but ignored
            disallow.push(route.replaceAll('**', '*'))
          }
        })
      }
      config.disallow = [...new Set(disallow)]
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

      const isRobotsGroupsBlockingIndexing = (config.groups as RobotsGroupResolved[]).some(
        g => g.userAgent.includes('*') && g.disallow.includes('/'),
      )

      if (isRobotsGroupsBlockingIndexing) {
        updateSiteConfig({
          _priority: 1, // this should be a source of truth
          _context: 'nuxt-simple-robots:config',
          indexable: false,
        })
      }

      nuxt.options.runtimeConfig['nuxt-simple-robots'] = {
        isRobotsGroupsBlockingIndexing,
        credits: config.credits,
        groups: config.groups,
        sitemap: config.sitemap,
        robotsEnabledValue: config.robotsEnabledValue,
        robotsDisabledValue: config.robotsDisabledValue,
      }
    })

    extendTypes('nuxt-simple-robots', () => {
      return `
interface NuxtSimpleRobotsNitroRules {
  index?: boolean
  robots?: string
}
declare module 'nitropack' {
  interface NitroRouteRules extends NuxtSimpleRobotsNitroRules {}
  interface NitroRouteConfig extends NuxtSimpleRobotsNitroRules {}
}`
    })

    // only prerender for `nuxi generate`
    nuxt.hooks.hook('nitro:init', async (nitro) => {
      if (nuxt.options._generate) {
        nitro.options.prerender.routes = nitro.options.prerender.routes || []
        nitro.options.prerender.routes.push('/robots.txt')
      }
    })

    // defineRobotMeta is a server-only composable
    nuxt.options.optimization.treeShake.composables.client['nuxt-simple-robots'] = ['defineRobotMeta']

    addImports({
      name: 'defineRobotMeta',
      from: resolve('./runtime/composables/defineRobotMeta'),
    })

    addComponent({
      name: 'RobotMeta',
      filePath: resolve('./runtime/components/RobotMeta'),
    })

    // add robots.txt server handler
    addServerHandler({
      route: '/robots.txt',
      handler: resolve('./runtime/server/robots-txt'),
    })
    // add robots HTTP header handler
    addServerHandler({
      handler: resolve('./runtime/server/middleware/xRobotsTagHeader'),
    })
  },
})
