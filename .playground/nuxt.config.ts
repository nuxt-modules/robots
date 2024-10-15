import { resolve } from 'node:path'
import { startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule } from '@nuxt/kit'
import { defineNuxtConfig } from 'nuxt/config'
import NuxtRobots from '../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
    /**
     * Start a sub Nuxt Server for developing the client
     *
     * The terminal output can be found in the Terminals tab of the devtools.
     */
    defineNuxtModule({
      setup(_, nuxt) {
        if (!nuxt.options.dev)
          return

        const subprocess = startSubprocess(
          {
            command: 'npx',
            args: ['nuxi', 'dev', '--port', '3030'],
            cwd: resolve(__dirname, '../client'),
          },
          {
            id: 'nuxt-robots:client',
            name: 'Nuxt Robots Client Dev',
          },
        )
        subprocess.getProcess().stdout?.on('data', (data) => {
          console.log(` sub: ${data.toString()}`)
        })

        process.on('exit', () => {
          subprocess.terminate()
        })

        // process.getProcess().stdout?.pipe(process.stdout)
        // process.getProcess().stderr?.pipe(process.stderr)
      },
    }),
  ],

  site: {
    url: 'https://nuxtseo.com/',
  },

  nitro: {
    typescript: {
      internalPaths: true,
    },
    plugins: ['plugins/robots.ts'],
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ],
    },
  },

  routeRules: {
    '/**/account': {
      robots: false,
      // index: false,
    },
    '/sub/:name': { robots: false },
    '/spa': { ssr: false },
  },

  experimental: {
    inlineRouteRules: true,
  },

  robots: {
    debug: true,
    // disallow: ['/'],
    sitemap: [
      '/sitemap.xml',
      '/sitemap.xml',
    ],
  },

  hooks: {
    'robots:config': function (robotsConfig) {
      robotsConfig.sitemap.push('/sitemap.xml')
    },
  },

  compatibilityDate: '2024-07-07',
})
