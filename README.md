<h1 align='center'>nuxt-simple-robots</h1>

<p align="center">
<a href='https://github.com/harlan-zw/nuxt-simple-robots/actions/workflows/test.yml'>
</a>
<a href="https://www.npmjs.com/package/nuxt-simple-robots" target="__blank"><img src="https://img.shields.io/npm/v/nuxt-simple-robots?style=flat&colorA=002438&colorB=28CF8D" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/nuxt-simple-robots" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/nuxt-simple-robots?flat&colorA=002438&colorB=28CF8D"></a>
<a href="https://github.com/harlan-zw/nuxt-simple-robots" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/harlan-zw/nuxt-simple-robots?flat&colorA=002438&colorB=28CF8D"></a>
</p>


<p align="center">
Simply manage your Nuxt v3 apps robot crawling.
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
<i>Status:</i> Early Access</b> <br>
<sup> Please report any issues 🐛</sup><br>
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦 • Join <a href="https://discord.gg/275MBUBvgP">Discord</a> for help</sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

## Features

- 🤖 Creates best practice robots.txt
- 🗿 Add `X-Robots-Tag` header and robot meta tag
- 🔄 Configure using route rules

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

### Set host (optional)

You'll need to provide the host of your site so that the crawler can resolve absolute URLs that may be internal.

```ts
export default defineNuxtConfig({
  // Recommended 
  runtimeConfig: {
    siteUrl: 'https://example.com',
  },
  // OR 
  sitemap: {
    host: 'https://example.com',
  },
})
```

## Module Config

### `host`

- Type: `string`
- Default: `runtimeConfig.public.siteUrl`
- Required: `false`

The host of your site. This is required to validate absolute URLs which may be internal.

### `trailingSlash`

- Type: `boolean`
- Default: `false`

Whether internal links should have a trailing slash or not.

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>


## License

MIT License © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
