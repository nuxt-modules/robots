# i18n Custom Route Paths Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve custom i18n route paths (from `i18n.pages` config) when expanding allow/disallow rules in robots.txt, matching the pattern used by nuxt-sitemap.

**Architecture:** Two-phase i18n path expansion — first map paths via `i18n.pages` config to their custom per-locale paths using `generatePathForI18nPages()`, then fall back to simple locale prefix expansion for unmapped paths. Ported from `/home/harlan/pkg/sitemap/src/utils-internal/i18n.ts` and `sitemap/src/module.ts:660-705`.

**Tech Stack:** Nuxt 3 module, `@nuxtjs/i18n`, `ufo` path utils, vitest e2e tests

---

### Task 1: Add `pages` to `AutoI18nConfig` type

**Files:**
- Modify: `src/runtime/types.ts:184-189`

**Step 1: Add pages field**

In `AutoI18nConfig`, add `pages` field after `strategy`:

```ts
export interface AutoI18nConfig {
  differentDomains?: boolean
  locales: NormalisedLocales
  defaultLocale: string
  strategy: 'prefix' | 'prefix_except_default' | 'prefix_and_default' | 'no_prefix'
  pages?: Record<string, Record<string, string | false>>
}
```

**Step 2: Commit**

```bash
git add src/runtime/types.ts
git commit -m "feat(i18n): add pages field to AutoI18nConfig type"
```

---

### Task 2: Pass `pages` config through `resolveI18nConfig()` and add `generatePathForI18nPages()`

**Files:**
- Modify: `src/i18n.ts`

**Step 1: Add `generatePathForI18nPages` function**

Port from sitemap module (`/home/harlan/pkg/sitemap/src/utils-internal/i18n.ts:31-45`). Add above `splitPathForI18nLocales`:

```ts
import { joinURL } from 'ufo'
```

```ts
export function generatePathForI18nPages(
  localeCode: string,
  pageLocales: string,
  defaultLocale: string,
  strategy: AutoI18nConfig['strategy'],
) {
  let path = pageLocales
  switch (strategy) {
    case 'prefix_except_default':
    case 'prefix_and_default':
      path = localeCode === defaultLocale ? pageLocales : joinURL(localeCode, pageLocales)
      break
    case 'prefix':
      path = joinURL(localeCode, pageLocales)
      break
  }
  return path
}
```

Simplified vs sitemap version: no domain support (robots doesn't need absolute URLs), no `forcedStrategy`, flat args instead of ctx object.

**Step 2: Pass `pages` in `resolveI18nConfig()`**

In the `resolvedAutoI18n` assignment (line 37-43), add `pages`:

```ts
resolvedAutoI18n = {
  differentDomains: nuxtI18nConfig.differentDomains,
  defaultLocale: nuxtI18nConfig.defaultLocale!,
  locales: normalisedLocales,
  strategy: nuxtI18nConfig.strategy as 'prefix' | 'prefix_except_default' | 'prefix_and_default',
  pages: nuxtI18nConfig.pages as Record<string, Record<string, string | false>> | undefined,
}
```

**Step 3: Commit**

```bash
git add src/i18n.ts
git commit -m "feat(i18n): add generatePathForI18nPages and pass pages config"
```

---

### Task 3: Add `mapPathForI18nPages()` helper

**Files:**
- Modify: `src/i18n.ts`

**Step 1: Add the mapping function**

This is ported from sitemap `module.ts:668-691`. Add after `generatePathForI18nPages`:

```ts
import { withLeadingSlash, withoutLeadingSlash, withoutTrailingSlash } from 'ufo'
```

```ts
export function mapPathForI18nPages(path: string, autoI18n: AutoI18nConfig): string[] | false {
  const pages = autoI18n.pages
  if (!pages || !Object.keys(pages).length)
    return false

  const withoutSlashes = withoutTrailingSlash(withoutLeadingSlash(path)).replace('/index', '')

  // direct match: path matches a page name in i18n pages config
  if (withoutSlashes in pages) {
    const pageLocales = pages[withoutSlashes]
    if (pageLocales) {
      return Object.entries(pageLocales)
        .filter(([, v]) => v !== false)
        .map(([localeCode, localePath]) =>
          withLeadingSlash(generatePathForI18nPages(localeCode, localePath as string, autoI18n.defaultLocale, autoI18n.strategy)),
        )
    }
  }

  // reverse match: path matches a custom locale path (e.g. user specified '/autre-page' which is fr custom path)
  for (const pageLocales of Object.values(pages)) {
    if (!pageLocales)
      continue
    if (autoI18n.defaultLocale in pageLocales && pageLocales[autoI18n.defaultLocale] === path) {
      return Object.entries(pageLocales)
        .filter(([, v]) => v !== false)
        .map(([localeCode, localePath]) =>
          withLeadingSlash(generatePathForI18nPages(localeCode, localePath as string, autoI18n.defaultLocale, autoI18n.strategy)),
        )
    }
  }

  return false
}
```

Returns `false` when no mapping found (caller falls through to prefix expansion), or `string[]` of resolved locale paths.

**Step 2: Commit**

```bash
git add src/i18n.ts
git commit -m "feat(i18n): add mapPathForI18nPages helper for custom route resolution"
```

---

### Task 4: Wire two-phase expansion in module.ts

**Files:**
- Modify: `src/module.ts:1` (import) and `src/module.ts:519-525` (expansion block)

**Step 1: Update import**

Change line 21 from:
```ts
import { resolveI18nConfig, splitPathForI18nLocales } from './i18n'
```
to:
```ts
import { mapPathForI18nPages, resolveI18nConfig, splitPathForI18nLocales } from './i18n'
```

**Step 2: Replace the i18n expansion block**

Replace `src/module.ts:519-525`:

```ts
if (resolvedAutoI18n && resolvedAutoI18n.locales && resolvedAutoI18n.strategy !== 'no_prefix') {
  const i18n = resolvedAutoI18n
  for (const group of config.groups.filter(g => !g._skipI18n)) {
    group.allow = asArray(group.allow || []).map(path => splitPathForI18nLocales(path, i18n)).flat()
    group.disallow = asArray(group.disallow || []).map(path => splitPathForI18nLocales(path, i18n)).flat()
  }
}
```

With two-phase expansion:

```ts
if (resolvedAutoI18n && resolvedAutoI18n.locales && resolvedAutoI18n.strategy !== 'no_prefix') {
  const i18n = resolvedAutoI18n
  for (const group of config.groups.filter(g => !g._skipI18n)) {
    // two-phase: first resolve custom i18n page paths, then prefix expansion for the rest
    group.allow = asArray(group.allow || []).map((path) => {
      if (typeof path !== 'string')
        return path
      return mapPathForI18nPages(path, i18n) || splitPathForI18nLocales(path, i18n)
    }).flat()
    group.disallow = asArray(group.disallow || []).map((path) => {
      if (typeof path !== 'string')
        return path
      return mapPathForI18nPages(path, i18n) || splitPathForI18nLocales(path, i18n)
    }).flat()
  }
}
```

**Step 3: Commit**

```bash
git add src/module.ts
git commit -m "feat(i18n): two-phase allow/disallow expansion with custom route paths"
```

---

### Task 5: Update test fixture with i18n pages config

**Files:**
- Modify: `test/fixtures/i18n/nuxt.config.ts`

**Step 1: Add i18n pages config and robots disallow**

The fixture needs `customRoutes: 'config'` and a `pages` mapping. Also add a disallow rule that references a page with custom paths.

Replace the i18n config block in `test/fixtures/i18n/nuxt.config.ts`:

```ts
// @ts-expect-error untyped
i18n: {
  baseUrl: 'https://nuxtseo.com',
  defaultLocale: 'en',
  strategy: 'prefix',
  customRoutes: 'config',
  locales: [
    {
      code: 'en',
      language: 'en-US',
    },
    {
      code: 'es',
      language: 'es-ES',
    },
    {
      code: 'fr',
      language: 'fr-FR',
    },
  ],
  pages: {
    'route-rules-custom-path': {
      en: '/other',
      fr: '/autre',
    },
  },
},
```

**Step 2: Remove `defineI18nRoute` from fixture page**

Since we switched to `customRoutes: 'config'`, remove the macro from `test/fixtures/i18n/pages/route-rules-custom-path.vue`:

```vue
<script lang="ts" setup>
import { defineRouteRules } from '#imports'

defineRouteRules({
  robots: false,
})
</script>

<template>
  <div>route rules custom path</div>
</template>
```

**Step 3: Commit**

```bash
git add test/fixtures/i18n/nuxt.config.ts test/fixtures/i18n/pages/route-rules-custom-path.vue
git commit -m "test: add i18n pages config to fixture"
```

---

### Task 6: Write and run tests

**Files:**
- Modify: `test/e2e/i18n.test.ts`

**Step 1: Add robots disallow config and custom path test**

Update the `nuxtConfig` in `setup()` to add a disallow that should be resolved via i18n pages:

```ts
await setup({
  rootDir: resolve('../fixtures/i18n'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      disallow: [
        '/secret',
        '/admin',
        '/route-rules-custom-path',
      ],
    },
  },
})
```

Update the `'basic'` test inline snapshot to include custom path expansion:

```ts
it('basic', async () => {
  const robotsTxt = await $fetch('/robots.txt')
  // /secret and /admin get simple prefix expansion
  expect(robotsTxt).toContain('Disallow: /secret')
  expect(robotsTxt).toContain('Disallow: /en/secret')
  expect(robotsTxt).toContain('Disallow: /es/secret')
  expect(robotsTxt).toContain('Disallow: /fr/secret')
  expect(robotsTxt).toContain('Disallow: /admin')
  expect(robotsTxt).toContain('Disallow: /en/admin')
  // /route-rules-custom-path gets custom i18n path resolution
  expect(robotsTxt).toContain('Disallow: /en/other')
  expect(robotsTxt).toContain('Disallow: /fr/autre')
  expect(robotsTxt).toContain('Disallow: /es/route-rules-custom-path')
  // should NOT contain the naive prefix expansion
  expect(robotsTxt).not.toContain('Disallow: /en/route-rules-custom-path')
  expect(robotsTxt).not.toContain('Disallow: /fr/route-rules-custom-path')
})
```

**Step 2: Run tests**

```bash
cd /home/harlan/pkg/nuxt-robots && pnpm vitest run test/e2e/i18n.test.ts
```

Expected: PASS — robots.txt contains custom i18n paths instead of naive prefix expansion.

**Step 3: Commit**

```bash
git add test/e2e/i18n.test.ts
git commit -m "test: verify i18n custom route path expansion in robots.txt"
```

---

### Task 7: Verify existing tests still pass

**Step 1: Run full test suite**

```bash
cd /home/harlan/pkg/nuxt-robots && pnpm vitest run
```

The `i18n-default.test.ts` test has no `pages` config so should use the fallback prefix expansion path unchanged.

**Step 2: Update any broken snapshots if needed**

If `i18n-default.test.ts` or other tests have inline snapshots that need updating due to the fixture changes, update them with:

```bash
cd /home/harlan/pkg/nuxt-robots && pnpm vitest run -u
```

Only accept snapshot updates that make sense — the i18n-default test uses the same fixture but different nuxtConfig overrides, so the `pages` config from the fixture should still apply.

**Step 3: Commit if snapshots updated**

```bash
git add test/
git commit -m "test: update snapshots for i18n custom paths"
```
