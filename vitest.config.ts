/// <reference types="vitest" />
/// <reference types="vitest/globals" />
import { defineVitestConfig } from '@nuxt/test-utils/config'
import { isCI } from 'std-env'

export default defineVitestConfig({
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
