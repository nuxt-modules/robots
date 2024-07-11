/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import { defineConfig } from 'vite'
import { isCI } from 'std-env'

export default defineConfig({
  test: {
    env: {
      // prod by default
      NODE_ENV: 'production',
    },
    poolOptions: {
      threads: {
        singleThread: !isCI,
      },
    },
    testTimeout: 60000,
    watchExclude: [
      'dist',
      'playground',
      'test/**/*',
      '**/.nuxt/**/*',
      '**/.output/**/*',
    ],
  },
})
