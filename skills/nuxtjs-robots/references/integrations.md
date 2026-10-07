# Integrations

Tested with `@nuxtjs/robots` 6.2.4, Nuxt 4.6.0, `@nuxt/content` 3.16.1, `zod` 4.6.5, and `@nuxtjs/i18n` 10.6.0.

## Nuxt Content v3

Add the `robots` frontmatter key to a collection. Add `zod` 4 to your own dependencies.
Without it the schema resolves Content's zod 3. Then `robots: false` arrives as the string `"false"`, and the page sends `X-Robots-Tag: false` and `content="false"`. Nothing warns.

```ts
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { defineRobotsSchema } from '@nuxtjs/robots/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({ robots: defineRobotsSchema() }),
    }),
  },
})
```

```vue
<!-- app/pages/[...slug].vue -->
<script setup lang="ts">
import { queryCollection, useAsyncData, useRobotsRule, useRoute, useSeoMeta } from '#imports'

const route = useRoute()
const { data: page } = await useAsyncData(`page-${route.path}`, () => queryCollection('content').path(route.path).first())
// The meta tag comes from page.seo. Only useRobotsRule() also sets the header.
useSeoMeta(page.value?.seo || {})
// Content returns null for an unset key. null sends X-Robots-Tag: null and drops the meta tag.
useRobotsRule(page.value?.robots ?? undefined)
</script>

<template>
  <div>{{ page?.title }}</div>
</template>
```

## Nuxt i18n

`allow` and `disallow` paths get one entry per locale prefix, and the unprefixed path stays.
Opt out with `_skipI18n: true` in a group, or with `robots.autoI18n: false`. Write route rules without the locale prefix.
They match locale-prefixed paths, also with `autoI18n: false`.
