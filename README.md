# @nuxtjs/robots

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Circle CI][circle-ci-src]][circle-ci-href]
[![Codecov][codecov-src]][codecov-href]
[![Dependencies][david-dm-src]][david-dm-href]
[![Standard JS][standard-js-src]][standard-js-href]

> A NuxtJS module thats inject a middleware to generate a robots.txt file

[📖 **Release Notes**](./CHANGELOG.md)

## Setup

1. Add the `@nuxtjs/robots` dependency with `yarn` or `npm` to your project
2. Add `@nuxtjs/robots` to the `modules` section of `nuxt.config.js`
3. Configure it:

```js
{
  modules: [
    // Simple usage
    '@nuxtjs/robots',

    // With options
    ['@nuxtjs/robots', {
      UserAgent: 'Googlebot',
      Disallow: '/'
    }],
  ]
}
```

### Using top level options

```js
{
  modules: [
    '@nuxtjs/robots',
  ],
  robots: {
    UserAgent: '*',
    Disallow: '/'
  }
}
```

## Options

The module option parameter can be an `object` (like above) or an `array of objects`.

```js
{
  modules: [
    '@nuxtjs/robots'
  ],
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
[npm-version-src]: https://img.shields.io/npm/dt/@nuxtjs/robots.svg?style=flat-square
[npm-version-href]: https://npmjs.com/package/@nuxtjs/robots
[npm-downloads-src]: https://img.shields.io/npm/v/@nuxtjs/robots/latest.svg?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@nuxtjs/robots
[circle-ci-src]: https://img.shields.io/circleci/project/github/nuxt-community/robots-module.svg?style=flat-square
[circle-ci-href]: https://circleci.com/gh/nuxt-community/robots-module
[codecov-src]: https://img.shields.io/codecov/c/github/nuxt-community/robots-module.svg?style=flat-square
[codecov-href]: https://codecov.io/gh/nuxt-community/robots-module
[david-dm-src]: https://david-dm.org/nuxt-community/robots-module/status.svg?style=flat-square
[david-dm-href]: https://david-dm.org/nuxt-community/robots-module
[standard-js-src]: https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square
[standard-js-href]: https://standardjs.com
