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
{
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
{
  modules: [
    '@nuxtjs/robots'
  ],
  robots: {
    /* module options */
  }
}
```

## Options

The module option parameter can be an `object`:

```js
{
  robots: {
    UserAgent: '*',
    Disallow: '/'
  }
}
```

or an `array of objects`:

```js
{
  robots: [
    {
      UserAgent: 'Googlebot',
      Disallow: '/users'
    },
    {
      UserAgent: 'Bingbot',
      Disallow: '/admin'
    }
  ]
}
```

### Will generate a /robots.txt

```bash
UserAgent: Googlebot
Disallow: /users
UserAgent: Bingbot
Disallow: /admin
```

## Development

1. Clone this repository
2. Install dependencies using `yarn install` or `npm install`
3. Start development server using `npm run dev`

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
