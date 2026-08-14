import { defineConfig, defineProject } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    reporters: 'dot',
    projects: [
      // utils folders as *.test.ts in either test/unit or in src/**/*.test.ts
      defineProject({
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            './test/unit/**/*.test.ts',
            './src/**/*.test.ts',
          ],
          exclude: [
            '**/node_modules/**',
          ],
        },
      }),
      // type-level tests via vitest typecheck
      defineProject({
        test: {
          name: 'typecheck',
          typecheck: {
            enabled: true,
            tsconfig: './test/types/tsconfig.json',
          },
          include: [
            './test/types/**/*.test-d.ts',
          ],
          exclude: [
            '**/node_modules/**',
            '**/.claude/**',
          ],
        },
      }),
      // e2e tests in test/e2e
      defineProject({
        test: {
          name: 'e2e',
          environment: 'node',
          include: [
            './test/e2e/**/*.test.ts',
          ],
          exclude: [
            '**/node_modules/**',
          ],
          globalSetup: './test/e2e/global-setup.ts',
        },
      }),
    ],
  },
})
