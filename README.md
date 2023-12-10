<h1 align='center'>nuxt-simple-robots</h1>

<p align="center">
<a href='https://github.com/harlan-zw/nuxt-simple-robots/actions/workflows/test.yml'>
</a>
<a href="https://www.npmjs.com/package/nuxt-simple-robots" target="__blank"><img src="https://img.shields.io/npm/v/nuxt-simple-robots?style=flat&colorA=002438&colorB=28CF8D" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/nuxt-simple-robots" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/nuxt-simple-robots?flat&colorA=002438&colorB=28CF8D"></a>
<a href="https://github.com/harlan-zw/nuxt-simple-robots" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/harlan-zw/nuxt-simple-robots?flat&colorA=002438&colorB=28CF8D"></a>
</p>

<p align="center">
Tame the robots crawling and indexing your Nuxt site with ease.
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

## Features

- 🤖 Merge in your existing robots.txt or programmatically create a new one
- 🗿 Automatic `X-Robots-Tag` header and `<meta name="robots" ...>` meta tag
- 🔄 Integrates with route rules and runtime hooks
- 🔒 Disables non-production environments from being indexed
- Solves common issues and best practice default config

## Installation

1. Install `nuxt-simple-robots` dependency to your project:

```bash
#
yarn add -D nuxt-simple-robots
#
npm install -D nuxt-simple-robots
#
pnpm i -D nuxt-simple-robots
```

2. Add it to your `modules` section in your `nuxt.config`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-simple-robots']
})
```

# Documentation

[📖 Read the full documentation](https://nuxtseo.com/robots) for more information.

## Demos

- [Default - StackBlitz](https://stackblitz.com/edit/nuxt-starter-zycxux?file=public%2F_robots.txt)

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
