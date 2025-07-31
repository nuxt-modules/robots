---
title: "Hook: robots:config"
description: Learn how to use Nuxt hooks to modify the robots config.
---

**Type:** `(config: ResolvedModuleOptions) => void | Promise<void>`{lang="ts"}

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
