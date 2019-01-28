# nuxt-robots-module

[![npm (scoped with tag)](https://img.shields.io/npm/v/nuxt-robots-module/latest.svg?style=flat-square)](https://npmjs.com/package/nuxt-robots-module)
[![CircleCI](https://img.shields.io/circleci/project/github/WilliamDASILVA/nuxt-robots-module.svg?style=flat-square)](https://circleci.com/gh/WilliamDASILVA/nuxt-robots-module)
[![npm](https://img.shields.io/npm/dt/nuxt-robots-module.svg?style=flat-square)](https://npmjs.com/package/nuxt-robots-module)
[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com)

> A NuxtJS module thats inject a middleware to generate a robots.txt file

## Table of Contents

* [Requirements](#requirements)
* [Install](#install)
* [Getting Started](#getting-started)
* [Options](#options)
* [Development](#development)
* [License](#license)

## Requirements

* npm or yarn
* NuxtJS
* NodeJS

## Install

```bash
$ npm install --save nuxt-robots-module
// or
$ yarn add nuxt-robots-module
```

## Getting Started

Add `nuxt-robots-module` to `modules` section of `nuxt.config.js`.

```js
{
  modules: [
    // Simple usage
    'nuxt-robots-module',

    // With options
    ['nuxt-robots-module', {
      /* module options */
      UserAgent: 'Googlebot',
      Disallow: '/',
    }],
 ]
}
```

or even

```js
{
  modules: [
    'nuxt-robots-module',
  ],
  robots: {
    /* module options */
    UserAgent: '*',
    Disallow: '/',
  },
}
```

## Options

The module option parameter can be an `object` (like above) or an `array of objects`.

```js
{
  modules: [
    'nuxt-robots-module',
  ],
  robots: [
    {
      UserAgent: 'Googlebot',
      Disallow: '/users',
    },
    {
      UserAgent: 'Bingbot',
      Disallow: '/admin',
    },
  ],
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

To run the development server, you can either install the dependencies locally by running:

```bash
npm install
```

or using `Docker` with `docker-compose`:

```bash
docker-compose up -d
```

This will run the a dev example through the `3000` port on localhost. You can then see your generated robots.txt in `localhost:3000/robots.txt`.

## License

Robots.txt generate code from https://github.com/weo-edu/express-robots repository.
Project generated with Nuxt module builder.

[MIT License](./LICENSE)
