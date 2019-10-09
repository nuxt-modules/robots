# @nuxtjs/robots

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Circle CI][circle-ci-src]][circle-ci-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

> A NuxtJS module thats inject a middleware to generate a robots.txt file

[📖 **Release Notes**](./CHANGELOG.md)

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

The module option parameter can be:

### `Object`

```js
export default {
  robots: {
    UserAgent: '*',
    Disallow: '/'
  }
}
```

### `Array`

```js
export default {
  robots: [
    {
      UserAgent: 'Googlebot',
      Disallow: () => '/users' // accepts function
    }
  ]
}
```

### `Function`

```js
export default {
  robots: () => {
    return {
      UserAgent: '*',
      Disallow: '/'
    }
  }
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

**Note:** Don't worry keys are parsed with case insensitive and special characters.

## License

[MIT License](./LICENSE)

Thanks [William DA SILVA](https://github.com/WilliamDASILVA) for making this module

Copyright (c) - Nuxt Community

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@nuxtjs/robots/latest.svg?style=flat-square
[npm-version-href]: https://npmjs.com/package/@nuxtjs/robots

[npm-downloads-src]: https://img.shields.io/npm/dt/@nuxtjs/robots.svg?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@nuxtjs/robots

[circle-ci-src]: https://img.shields.io/circleci/project/github/nuxt-community/robots-module.svg?style=flat-square
[circle-ci-href]: https://circleci.com/gh/nuxt-community/robots-module

[codecov-src]: https://img.shields.io/codecov/c/github/nuxt-community/robots-module.svg?style=flat-square
[codecov-href]: https://codecov.io/gh/nuxt-community/robots-module

[license-src]: https://img.shields.io/npm/l/@nuxtjs/robots.svg?style=flat-square
[license-href]: https://npmjs.com/package/@nuxtjs/robots
