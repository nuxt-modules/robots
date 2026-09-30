import { fileURLToPath } from 'node:url'
import { build, loadNuxt } from 'nuxt'

const nuxt = await loadNuxt({ cwd: import.meta.dirname, overrides: { dev: false } })
try {
  // Resolve the pinned builder directly instead of the outer workspace.
  nuxt.options.builder = fileURLToPath(import.meta.resolve('@nuxt/vite-builder'))
  // Older Vite virtual modules require an alias without a trailing slash.
  nuxt.options.alias['#build'] = nuxt.options.buildDir
  await build(nuxt)
}
finally {
  await nuxt.close()
}
