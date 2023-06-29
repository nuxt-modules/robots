/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    env: {
      // prod by default
      NODE_ENV: 'production',
    },
    testTimeout: 60000,
    threads: true,
    deps: {
      inline: [
        '@nuxt/test-utils',
        '@nuxt/test-utils-edge',
      ],
    },
    watchExclude: [
      'dist',
      'playground',
      'test/**/*',
      '**/.nuxt/**/*',
      '**/.output/**/*',
    ],
  },
})
