# @nuxtjs/robots

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions CI][github-actions-ci-src]][github-actions-ci-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

> A Nuxt.js module that injects a middleware to generate a robots.txt file

- [📖 **Release Notes**](./CHANGELOG.md)

## Features

- Nuxt 3 and Nuxt Bridge support
- Generate `robots.txt` for static mode
- Add middleware for `robots.txt`

## Setup

1. Add `@nuxtjs/robots` dependency to your project

```bash
yarn add @nuxtjs/robots # or npm install @nuxtjs/robots
```

2. Add `@nuxtjs/robots` to the `modules` section of `nuxt.config.js`

```js
export default {
  modules: [
    // Simple usage
    '@nuxtjs/robots',

    // With options
    ['@nuxtjs/robots', { /* module options */ }]
  ]
}
```

### Using top level options

```js
export default {
  modules: [
    '@nuxtjs/robots'
  ],
  robots: {
    /* module options */
  }
}
```

## Options

### configPath

- Type: `String`
- Default: `robots.config`

### rules

- Type: `Object|Array`
- Default: 
```js
{
  UserAgent: '*',
  Disallow: ''
}
```

## Robots config

If you need to use function in any rule, you need to create a config file through the `configPath` option

```js
export default {
  UserAgent: '*',
  Disallow: '/',
      
  // Be aware that this will NOT work on target: 'static' mode
  Sitemap: (req) => `https://${req.headers.host}/sitemap.xml`
}
```

### Will generate a /robots.txt

```bash
User-agent: Googlebot
Disallow: /users
User-agent: Bingbot
Disallow: /admin
```

### The keys and values available:

- UserAgent = `User-agent`
- CrawlDelay = `Crawl-delay`
- Disallow = `Disallow`
- Allow = `Allow`
- Host = `Host`
- Sitemap = `Sitemap`
- CleanParam = `Clean-param`

**Note:** Don't worry, keys are parsed with case insensitivity and special characters.

## License

[MIT License](./LICENSE)

Copyright (c) - Nuxt Community

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@nuxtjs/robots/latest.svg
[npm-version-href]: https://npmjs.com/package/@nuxtjs/robots

[npm-downloads-src]: https://img.shields.io/npm/dt/@nuxtjs/robots.svg
[npm-downloads-href]: https://npmjs.com/package/@nuxtjs/robots

[github-actions-ci-src]: https://github.com/nuxt-community/robots-module/workflows/ci/badge.svg
[github-actions-ci-href]: https://github.com/nuxt-community/robots-module/actions?query=workflow%3Aci

[codecov-src]: https://img.shields.io/codecov/c/github/nuxt-community/robots-module.svg
[codecov-href]: https://codecov.io/gh/nuxt-community/robots-module

[license-src]: https://img.shields.io/npm/l/@nuxtjs/robots.svg
[license-href]: https://npmjs.com/package/@nuxtjs/robots
