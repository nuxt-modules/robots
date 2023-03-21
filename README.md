<h1 align='center'>nuxt-simple-robots</h1>

<p align="center">
<a href='https://github.com/harlan-zw/nuxt-simple-robots/actions/workflows/test.yml'>
</a>
<a href="https://www.npmjs.com/package/nuxt-simple-robots" target="__blank"><img src="https://img.shields.io/npm/v/nuxt-simple-robots?style=flat&colorA=002438&colorB=28CF8D" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/nuxt-simple-robots" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/nuxt-simple-robots?flat&colorA=002438&colorB=28CF8D"></a>
<a href="https://github.com/harlan-zw/nuxt-simple-robots" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/harlan-zw/nuxt-simple-robots?flat&colorA=002438&colorB=28CF8D"></a>
</p>


<p align="center">
Simply manage the robots crawling your Nuxt 3 app.
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
<i>Status:</i> <a href="https://github.com/harlan-zw/nuxt-simple-robots/releases/tag/v2.0.0">v2 Released 🎉</a></b> <br>
<sup> Please report any issues 🐛</sup><br>
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦 • Join <a href="https://discord.gg/275MBUBvgP">Discord</a> for help</sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

ℹ️ Looking for a complete SEO solution? Check out [Nuxt SEO Kit](https://github.com/harlan-zw/nuxt-seo-kit).

## Features

- 🤖 Creates best practice robot data
- 🗿 Adds `X-Robots-Tag` header, robot meta tag and robots.txt
- 🔄 Configure using route rules and hooks
- 🔒 Disables non-production environments from being crawled automatically
- Best practice default config

### Zero Config Integrations

- [`nuxt-simple-robots`](https://github.com/harlan-zw/nuxt-simple-robots)

Will automatically add sitemap entries.

## Install

```bash
npm install --save-dev nuxt-simple-robots

# Using yarn
yarn add --dev nuxt-simple-robots
```

## Setup

_nuxt.config.ts_

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-simple-robots',
  ],
})
```

### Configure route indexing

Using route rules, you can configure how your routes are indexed by search engines.

For routes that have `index: false`, meta tags and headers will be added to prevent indexing. 

```ts
export default defineNuxtConfig({
  routeRules: {
    // use the `index` shortcut for simple rules
    '/secret/**': { index: false },
    // add exceptions for individual routes
    '/secret/visible': { index: true },
    // use the `robots` rule if you need finer control
    '/custom-robots': { robots: 'index, follow' },
  }
})
```

If you prefer to have these values within the robots.txt itself, you should use the `exclude` rule as well.

```ts
export default defineNuxtConfig({
  robots: {
      exclude: [
        '/secret/**',
      ]
  },
})
```


## Injecting Meta Tags

By default, only the robots.txt and HTTP headers provided by server middleware will be used to control indexing. 

It's recommended for SSG apps or to improve debugging, to add a meta tags to your page as well.

Within your app.vue or a layout:

```vue
<script lang="ts" setup>
// Use Composition API
defineRobotMeta()
</script>
<template>
  <div>
    <!-- OR Component API -->
    <RobotMeta />
  </div>
</template>
```

## Module Config

### `siteUrl`

- Type: `string`
- Default: `process.env.NUXT_PUBLIC_SITE_URL || nuxt.options.runtimeConfig.public?.siteUrl`

Used to ensure sitemaps are absolute URLs.

It's recommended that you use runtime config for this.

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      // can be set with environment variables
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://example.com',
    }
  },
})
```

### `indexable`

- Type: `boolean`
- Default: `process.env.NUXT_INDEXABLE || nuxt.options.runtimeConfig.indexable || process.env.NODE_ENV === 'production'`

Whether the site is indexable by search engines.

It's recommended that you use runtime config for this.

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    // can be set with environment variables
    indexable: process.env.NUXT_INDEXABLE || false,
  },
})
```

### `disallow`

- Type: `string[]`
- Default: `[]`
- Required: `false`

Disallow paths from being crawled.

### `sitemap`

- Type: `string | string[] | false`
- Default: `false`

The sitemap URL(s) for the site. If you have multiple sitemaps, you can provide an array of URLs. 

You must either define the runtime config `siteUrl` or provide the sitemap as absolute URLs.

```ts
export default defineNuxtConfig({
  robots: {
    sitemap: [
      '/sitemap-one.xml',
      '/sitemap-two.xml',
    ],
  },
})
```

### `robotsEnabledValue`

- Type: `string`
- Default: `'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'`
- Required: `false`

The value to use when the site is indexable.

### `robotsDisabledValue`

- Type: `string`
- Default: `'noindex, nofollow'`
- Required: `false`

The value to use when the site is not indexable.

## Nuxt Hooks

### `robots:config`

**Type:** `async (config: ModuleOptions) => void | Promise<void>`

This hook allows you to modify the robots config before it is used to generate the robots.txt and meta tags.

```ts
export default defineNuxtConfig({
  hooks: {
    'robots:config': (config) => {
      // modify the config
      config.sitemap = '/sitemap.xml'
    },
  },
})
```

## Nitro Hooks

### `robots:robots-txt`

**Type:** `async (ctx: { robotsTxt: string }) => void | Promise<void>`

This hook allows you to modify the robots.txt content before it is sent to the client.

```ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'

export default defineNitroPlugin((nitroApp) => {
  if (!process.dev) {
    nitroApp.hooks.hook('robots:robots-txt', async (ctx) => {
      // remove comments from robotsTxt in production
      ctx.robotsTxt = ctx.robotsTxt.replace(/^#.*$/gm, '').trim()
    })
  }
})
```

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>


## License

MIT License © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
