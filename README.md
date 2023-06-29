<h1 align='center'>nuxt-simple-robots</h1>

<p align="center">
<a href='https://github.com/harlan-zw/nuxt-simple-robots/actions/workflows/test.yml'>
</a>
<a href="https://www.npmjs.com/package/nuxt-simple-robots" target="__blank"><img src="https://img.shields.io/npm/v/nuxt-simple-robots?style=flat&colorA=002438&colorB=28CF8D" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/nuxt-simple-robots" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/nuxt-simple-robots?flat&colorA=002438&colorB=28CF8D"></a>
<a href="https://github.com/harlan-zw/nuxt-simple-robots" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/harlan-zw/nuxt-simple-robots?flat&colorA=002438&colorB=28CF8D"></a>
</p>


<p align="center">
The simplest way to control the robots crawling and indexing your Nuxt site.
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
<i>Status:</i> <a href="https://github.com/harlan-zw/nuxt-simple-robots/releases/tag/v3.0.0">v3 Released 🎉</a></b> <br>
<sup> Please report any issues 🐛</sup><br>
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦 • Join <a href="https://discord.gg/275MBUBvgP">Discord</a> for help</sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

ℹ️ Looking for a complete SEO solution? Check out [Nuxt SEO Kit](https://github.com/harlan-zw/nuxt-seo-kit).

## Features

- 🤖 Merge in your existing robots.txt or programmatically create a new one
- 🗿 Automatic `X-Robots-Tag` header and `<meta name="robots` ...>` meta tag
- 🔄 Integrates with route rules and runtime hooks
- 🔒 Disables non-production environments from being indexed
- Solves common issues and best practice default config

### Module Integrations

- [`nuxt-site-conifg`](https://github.com/harlan-zw/nuxt-site-config) - Configures the canonical site URL for absolute sitemap entries.
- [`nuxt-simple-sitemap`](https://github.com/harlan-zw/nuxt-simple-sitemap) - Adds sitemap entries.

## Install

```bash
npm install -D nuxt-simple-robots
#
yarn add --dev nuxt-simple-robots
#
pnpm add -D nuxt-simple-robots
```

## Setup

Add the module to your `nuxt.config.ts`.

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-simple-robots',
  ],
})
```

## Usage

### Robots.txt configuration

The recommendation way to implement your robots.txt configuration,
is to simply create a `robots.txt` file in your project root or assets folder.

For environments that are indexable,
this file will be parsed and merged with the module config.

```txt
User-agent: *
Disallow: /secret
```

If you'd prefer to load your `robots.txt` file from a different path, you can use the `mergeWithRobotsTxtPath` config.

#### Public folder 

You're free to place your `robots.txt` in your `<rootDir>/public` folder,
however, you won't benefit from all the features of this module.

### Programmatic build-time configuration

If you need programmatic control, you can configure the module using nuxt.config with the following options:
- `disallow` - An array of paths to disallow for `*`
- `allow` - An array of paths to allow for `*`
- `stacks` - A stack of objects to provide granular control (see below)

```ts
export default defineNuxtConfig({
  robots: {
    // provide simple disallow rules for all robots `user-agent: *`
    disallow: ['/secret'],
    // add more granular rules
    stacks: [
      // block specific robots from specific pages
      {
        userAgents: ['AdsBot-Google-Mobile', 'AdsBot-Google-Mobile-Apps'],
        disallow: ['/admin'],
        allow: ['/admin/login'],
        comments: 'Allow Google AdsBot to index the login page but no-admin pages'
      },
    ]
  }
})
```

### Route Rules configuration

If you prefer, you can use route rules to configure how your routes are indexed by search engines.

You can provide the following rules:

- `index: false` - Will disable the route from being indexed using the `robotsDisabledValue`config _(default `noindex, nofollow`)_
- `robots: <string>` - Will add robots the provided string as the robots rule

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

The rules are applied using the following logic:
- `X-Robots-Tag` header - SSR only
- `<meta name="robots">` - When using the `defineRobotMeta` or `RobotMeta` composable or component
- `/robots.txt` disallow entry - When `disallowNonIndexableRoutes` is enabled

### Meta Tags

By default, only the `/robots.txt` and `X-Robots-Tag` HTTP header will be used to control indexing. 

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

### Prerendering robots.txt

If you plan to prerender your robots.txt and aren't providing absolute sitemap URLs, then you should
provide a canonical site URL through the [nuxt-site-config](https://github.com/harlan-zw/nuxt-site-config) module.

```ts
export default defineNuxtConfig({
  // @see https://github.com/harlan-zw/nuxt-site-config
  site: {
    url: process.env.NUXT_SITE_URL || 'https://example.com',
  },
})
```

## Module Config

### `enabled`

- Type: `boolean`
- Default: `true`
- Required: `false`

Conditionally toggle the module.


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

### `allow`

- Type: `string[]`
- Default: `[]`
- Required: `false`

Allow paths to be indexed for the `*` user-agent (all robots).

### `disallow`

- Type: `string[]`
- Default: `[]`
- Required: `false`

Disallow paths from being indexed for the `*` user-agent (all robots).

### `stacks`

- Type: `{ userAgent: []; allow: []; disallow: []; comments: [] }[]`
- Default: `[]`
- Required: `false`

Define more granular rules for the robots.txt. Each stack is a set of rules for specific user agent(s).

```ts
export default defineNuxtConfig({
  robots: {
    stacks: [
      {
        userAgents: ['AdsBot-Google-Mobile', 'AdsBot-Google-Mobile-Apps'],
        disallow: ['/admin'],
        allow: ['/admin/login'],
        comments: 'Allow Google AdsBot to index the login page but no-admin pages'
      },
    ]
  }
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

### `disallowNonIndexableRoutes`

- Type: `boolean`
- Default: `'false'`

Should route rules which disallow indexing be added to the `/robots.txt` file.

### `mergeWithRobotsTxtPath`

- Type: `boolean | string`
- Default: `true`
- Required: `false`

Specify a robots.txt path to merge the config from, relative to the root directory.

When set to `true`, the default path of `<publicDir>/robots.txt` will be used.

When set to `false`, no merging will occur.

### `blockNonSeoBots`

- Type: `boolean`
- Default: `false`
- Required: `false`

Blocks bots that don't benefit our SEO and are known to cause issues.

### `debug`

- Type: `boolean`
- Default: `false`
- Required: `false`

Enables debug logs and a debug endpoint.

### `credits`

- Type: `boolean`
- Default: `true`
- Required: `false`

Should the robots.txt display credits for the module.

### `siteUrl` - DEPRECATED

- Type: `string`

Used to ensure sitemaps are absolute URLs.

Note: This is only required when prerendering your site.

This is now handled by the [nuxt-site-config](https://github.com/harlan-zw/nuxt-site-config) module.

You should provide `url` through site config instead, otherwise see the module for more examples.  

```ts
export default defineNuxtConfig({
  site: {
    url: process.env.NUXT_SITE_URL || 'https://example.com',
  },
})
```

### `indexable` - DEPRECATED

- Type: `boolean`
- Default: `process.env.NODE_ENV === 'production'`

Whether the site is indexable by search engines.

This is now handled by the [nuxt-site-config](https://github.com/harlan-zw/nuxt-site-config) module.

If you need to change the default,
then you should provide `indexable` through site config instead or see the module for more examples.

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
