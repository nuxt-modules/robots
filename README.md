# nuxt-robots-module

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Circle CI][circle-ci-src]][circle-ci-href]
[![Codecov][codecov-src]][codecov-href]
[![Dependencies][david-dm-src]][david-dm-href]
[![Standard JS][standard-js-src]][standard-js-href]

> A NuxtJS module thats inject a middleware to generate a robots.txt file

[📖 **Release Notes**](./CHANGELOG.md)

## Setup

1. Add the `nuxt-robots-module` dependency with `yarn` or `npm` to your project
2. Add `nuxt-robots-module` to the `modules` section of `nuxt.config.js`
3. Configure it:

```js
{
  modules: [
    // Simple usage
    'nuxt-robots-module',

    // With options
    ['nuxt-robots-module', {
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
    'nuxt-robots-module',
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
    'nuxt-robots-module'
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

Copyright (c) - William DA SILVA <william.da.silva@outlook.com>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/dt/nuxt-robots-module.svg?style=flat-square
[npm-version-href]: https://npmjs.com/package/nuxt-robots-module
[npm-downloads-src]: https://img.shields.io/npm/v/nuxt-robots-module/latest.svg?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/nuxt-robots-module
[circle-ci-src]: https://img.shields.io/circleci/project/github/WilliamDASILVA/nuxt-robots-module.svg?style=flat-square
[circle-ci-href]: https://circleci.com/gh/WilliamDASILVA/nuxt-robots-module
[codecov-src]: https://img.shields.io/codecov/c/github/WilliamDASILVA/nuxt-robots-module.svg?style=flat-square
[codecov-href]: https://codecov.io/gh/WilliamDASILVA/nuxt-robots-module
[david-dm-src]: https://david-dm.org/WilliamDASILVA/nuxt-robots-module/status.svg?style=flat-square
[david-dm-href]: https://david-dm.org/WilliamDASILVA/nuxt-robots-module
[standard-js-src]: https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square
[standard-js-href]: https://standardjs.com
