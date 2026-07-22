// Served via the `#internal/nuxt-robots` nitro alias (module.ts points it here when
// robots is disabled) so sibling modules can subpath-import e.g.
// `#internal/nuxt-robots/getSiteRobotConfig` (see @nuxtjs/sitemap's runtime/server/sitemap/nitro.ts).
// Keep this file's exports mirroring runtime/server/composables/getSiteRobotConfig.ts.
export { getSiteRobotConfig } from '../mock-composables'
