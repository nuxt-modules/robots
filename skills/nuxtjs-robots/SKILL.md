---
name: nuxtjs-robots
description: Controls crawling and indexing in Nuxt with @nuxtjs/robots, which generates robots.txt, the X-Robots-Tag header, and the robots meta tag. Use when a task mentions robots.txt, noindex, nofollow, keeping staging or preview sites out of Google, the robots config key, robots route rules, useRobotsRule, getPathRobotConfig, getSiteRobotConfig, useBotDetection, getBotDetection, blockAiBots, AI crawlers, or a page that is still indexed or wrongly blocked.
license: MIT
compatibility: "Requires a project using @nuxtjs/robots. Requires Node.js ^22.22.3 || ^24.15.0 || >=26.0.0. Requires Nuxt ^4.6.0 || ^5.0.0."
---

# @nuxtjs/robots

Tested with `@nuxtjs/robots` 6.2.4 on Nuxt 4.6.0, with the Node server and `nuxt generate`.
The module serves `/robots.txt`, sends `X-Robots-Tag`, and adds `<meta name="robots">` to each SSR page.
Site config decides if the whole site is indexable. Route rules decide per path.

## Setup

```ts
// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/robots'],
  site: { url: 'https://example.com' },
})
```

Site-wide indexing is a `site` key (nuxt-site-config), not a `robots` key.

## Automatic behaviour

- The site is indexable if `site.indexable` is true. If it is unset, the site is indexable when the site `env` is `production`. `nuxt dev` is not indexable. `nuxt build` and `nuxt generate` are.
- Indexable: robots.txt is `User-agent: *` and an empty `Disallow:`. Pages get `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
- Not indexable: robots.txt is `Disallow: /`. Every response gets `X-Robots-Tag: noindex, nofollow`, including API routes, `/robots.txt`, and `/_nuxt/` files.
- `/_nuxt/**` always gets `X-Robots-Tag: noindex`.
- The module merges a hand-written robots.txt from `public/_robots.txt`, `assets/robots.txt`, `pages/robots.txt`, or `robots.txt`, all relative to the project root. It ignores `app/assets/` and `app/pages/` without a warning. Nuxt renames `public/robots.txt` to `public/_robots.txt` in your source tree each time it loads the module, `nuxt prepare` included.
- `nuxt generate` prerenders `/robots.txt`. A static preset that reads `_headers`, such as Netlify, gets the header rules there.
- To turn parts off, set `robots.robotsTxt`, `robots.header`, or `robots.metaTag` to `false`. `useRobotsRule()` still writes a meta tag when `metaTag` is `false`. `robots.enabled: false` turns off everything, and the composables do nothing.

## Common tasks

Keep paths out of search results. By default, a route rule does not change robots.txt.

```ts
// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/robots'],
  site: { url: 'https://example.com' },
  // Only needed for defineRouteRules() in a page.
  experimental: { inlineRouteRules: true },
  routeRules: {
    '/admin/**': { robots: false }, // robotsDisabledValue: noindex, nofollow
    '/tags/**': { robots: 'noindex, follow' },
    '/docs/**': { robots: { 'index': true, 'max-snippet': 120 } },
  },
})
```

Decide per request, during SSR. Route rules cannot match a query string:

```vue
<!-- app/pages/search.vue -->
<script setup lang="ts">
import { useRobotsRule, useRoute } from '#imports'

const route = useRoute()
// Call it only to noindex. useRobotsRule(true) would make a staging page indexable.
if (route.query.q)
  useRobotsRule('noindex, follow')
</script>

<template>
  <div>Search</div>
</template>
```

With `experimental.inlineRouteRules`, `defineRouteRules({ robots: false })` in a page sets a static rule.

Keep staging out of search: set `NUXT_SITE_ENV=staging` or `NUXT_SITE_INDEXABLE=false`. The Node server reads both at runtime.
For `nuxt generate`, set `NUXT_SITE_INDEXABLE=false` at build time. `NUXT_SITE_ENV=staging` there blocks robots.txt and the meta tags, but `_headers` gets no site-wide noindex rule.

Remove a live site from search: add the route rule `'/**': { robots: 'noindex, nofollow' }`. A more specific robots route rule, or a `useRobotsRule()` call, still wins over it.
Do not use `site.indexable: false` for this. Its `Disallow: /` stops crawlers before they read `noindex`.

Write robots.txt rules:

```ts
// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/robots'],
  site: { url: 'https://example.com' },
  robots: {
    disallow: ['/admin'],
    allow: ['/admin/login'],
    sitemap: '/sitemap.xml', // made absolute with site.url
    blockAiBots: true, // GPTBot, ClaudeBot, Google-Extended, and others
    groups: [
      { userAgent: ['Googlebot'], disallow: ['/private'], comment: ['Google only'] },
    ],
  },
})
```

Server examples use Nitro auto-imports. On Nuxt 4.6, importing them from `#imports` in a server file fails `nuxt typecheck`.

Turn off indexing for one host of a multi-domain deployment. This is per request:

```ts
// server/plugins/robots-host.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('site-config:init', ({ event, siteConfig }) => {
    if (getRequestHost(event).startsWith('staging.'))
      siteConfig.push({ _context: 'staging-host', indexable: false })
  })
})
```

In Nitro, `getSiteRobotConfig(event)` returns `{ indexable, hints }`. `getPathRobotConfig(event, { path })` returns `{ indexable, rule, debug }`.

Detect bots from the `User-Agent` header:

```ts
// server/middleware/block-bots.ts
export default defineEventHandler((event) => {
  const bot = getBotDetection(event) // { isBot, botName, botCategory, trusted }
  // Search engines and AI crawlers count as trusted. To block AI crawlers, test bot.botCategory === 'ai'.
  if (event.path.startsWith('/api/') && bot.isBot && !bot.trusted)
    throw createError({ statusCode: 403 })
})
```

In the app, `useBotDetection()` returns the same fields as computed refs.
`useBotDetection({ fingerprint: true })` also runs BotD in the browser. Its result arrives later, so watch `isBot`.
Outside Nuxt, `getBotDetection(headers)` from `@nuxtjs/robots/util` reads only a lowercase `user-agent` key. Pass `Object.fromEntries(request.headers)`. A `Headers` instance returns `isBot: false`.

## Integrations

Nuxt Content v3 frontmatter and Nuxt i18n path expansion: [references/integrations.md](references/integrations.md).

## Traps

- A path can be crawlable and noindex, or blocked in robots.txt. It cannot be both. Google never reads `noindex` on a disallowed URL and can still index it from links.
- `useRobotsRule(true)` sends `robotsEnabledValue` even when the site is not indexable. Pass `true` only to override that.
- `useRobotsRule()` sets the rule only during SSR. In the browser it only reads the rendered value.
- `noai` or `noimageai` makes a path non-indexable to the module, even with `index: true`. `getPathRobotConfig` returns `indexable: false`, and `disallowNonIndexableRoutes` disallows the path.
- An `app.baseURL` other than `/` turns off robots.txt and logs an error. Crawlers only read `/robots.txt` at the host root.
- Nuxt Content frontmatter `robots` sets the meta tag but not the header, and it needs `zod` 4 in your dependencies. See [references/integrations.md](references/integrations.md).
- The key is `blockAiBots`. Some docs prose spells it `blockAIBots`.

## Version limits

These hold for 6.2.4:

- `definePageMeta({ robots })` has no effect on Nuxt 4.6. Use a route rule, `defineRouteRules()`, or `useRobotsRule()`.
- A build that calls `useBotDetection()` fails with `Rolldown failed to resolve import "@vueuse/core"` unless the app installs `@vueuse/core`.
- `robots.disableNuxtContentIntegration` has no effect.
- The docs' `robots:config` Nitro hook that edits `ctx.groups` per host leaks. The result is shared, so other hosts get `noindex` until the next `/robots.txt` request. Use the `site-config:init` plugin above.
- `groups[].comment` must be an array. A string prints one `#` line per character.
- `disallowNonIndexableRoutes: true` (deprecated) also writes `Disallow: /_nuxt` and `Disallow: /_nuxt/*` into robots.txt.

## Config

All options: [nuxtseo.com/docs/robots/api/config](https://nuxtseo.com/docs/robots/api/config). Options that are easy to miss:

- `robotsEnabledValue` and `robotsDisabledValue`: the rule strings for indexable and non-indexable paths.
- `mergeWithRobotsTxtPath`: a robots.txt path to merge, relative to the root, or `false`.
- `cacheControl`: the robots.txt `Cache-Control`. The default is `max-age=14400, must-revalidate`. Dev always sends `no-store`.

## Debug

- In dev, add `?mockProductionEnv` to a URL to see the production rules. The meta tag shows the rule source in `data-hint`.
- `/__robots__/debug-path.json?path=/admin&mockProductionEnv=true` returns the rule, its source, and the header.
- `/__robots__/debug.json` returns robots.txt, the indexable hints, and the resolved config. Both routes exist in dev, or with `robots.debug: true`.
