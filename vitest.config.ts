/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import { isCI } from 'std-env'
import { defineConfig } from 'vite'

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
