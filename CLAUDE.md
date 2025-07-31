# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `pnpm build` - Builds the module using nuxt-module-build and generates client
- **Development**: `pnpm dev` - Runs playground at `.playground` directory
- **Development Preparation**: `pnpm dev:prepare` - Prepares development environment with stub build
- **Test**: `pnpm test` - Runs vitest test suite
- **Lint**: `pnpm lint` - Runs ESLint with auto-fix using @antfu/eslint-config
- **Type Check**: `pnpm typecheck` - Runs TypeScript compiler for type checking
- **Client Development**: `pnpm client:dev` - Runs devtools UI client on port 3300
- **Release**: `pnpm release` - Builds, bumps version, and publishes

## Architecture Overview

This is a Nuxt module (`@nuxtjs/robots`) that provides robots.txt generation and robot meta tag functionality for Nuxt applications.

### Core Module Structure

- **`src/module.ts`**: Main module entry point with module options and setup logic
- **`src/runtime/`**: Runtime code that gets injected into user applications
  - **`app/`**: Client-side runtime (composables, plugins)
  - **`server/`**: Server-side runtime (middleware, routes, composables)
- **`src/kit.ts`**: Utilities for build-time module functionality
- **`src/util.ts`**: Shared utilities exported to end users

### Key Runtime Components

- **Server Routes**:
  - `/robots.txt` route handler in `src/runtime/server/routes/robots-txt.ts`
  - Debug routes under `/__robots__/` for development
- **Server Composables**: `getSiteRobotConfig()` and `getPathRobotConfig()` for runtime robot configuration
- **Client Composables**: `useRobotsRule()` for accessing robot rules in Vue components
- **Meta Plugin**: Automatically injects robot meta tags and X-Robots-Tag headers

### Build System

- Uses `@nuxt/module-builder` with unbuild configuration in `build.config.ts`
- Exports multiple entry points: main module, `/util`, and `/content`
- Supports both ESM and CommonJS via rollup configuration

### Test Structure

- **Integration Tests**: Test fixtures in `test/fixtures/` with full Nuxt apps
- **Unit Tests**: Focused tests in `test/unit/` for specific functionality
- Uses `@nuxt/test-utils` for testing Nuxt applications
- Test environment automatically set to production mode

### Development Workflow

The module supports a playground at `.playground` for local development and manual testing. The client UI (devtools integration) is developed separately in the `client/` directory.

### I18n Integration

The module has special handling for i18n scenarios, with logic in `src/i18n.ts` for splitting paths and handling localized routes.

### Content Integration

Provides integration with Nuxt Content module via `src/content.ts` for content-based robot configurations.
