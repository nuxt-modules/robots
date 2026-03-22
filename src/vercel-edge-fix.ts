import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import { resolveNitroPreset } from './kit'

const RE_REFLECT_HAS_MINIFIED = /Reflect\.has\(([\w$]+),([\w$]+)\)\?Reflect\.get\(\1,\2,([\w$]+)\):Reflect\.get\(([\w$]+),\2,\3\)/g

/**
 * Patches the compiled Vercel Edge server entry to fix unenv v2's process polyfill.
 *
 * unenv's Process class uses private fields (#stdin, #stdout, #stderr, #cwd) but the
 * process polyfill wraps it in a Proxy. Vercel Edge's minimal process object causes
 * property lookups to fall through to processModule, where `this` is the Proxy (not the
 * Process instance), causing "Cannot read private member" errors.
 *
 * TODO: remove once https://github.com/unjs/unenv/issues/399 is fixed
 */
export function setupVercelEdgeFix(nuxt: { hooks: { hook: (name: string, fn: (...args: any[]) => any) => void } }) {
  nuxt.hooks.hook('nitro:init', (nitro: any) => {
    const target = resolveNitroPreset(nitro.options)
    const normalizedTarget = target.replace(/_legacy$/, '')
    if (normalizedTarget !== 'vercel-edge')
      return

    nitro.hooks.hook('compiled', async (_nitro: any) => {
      const configuredEntry = nitro.options.rollupConfig?.output.entryFileNames
      const serverEntry = join(
        _nitro.options.output.serverDir,
        typeof configuredEntry === 'string' ? configuredEntry : 'index.mjs',
      )
      if (!existsSync(serverEntry))
        return

      let contents = await readFile(serverEntry, 'utf-8')
      const original = contents

      // Fix unformatted output (tabs/newlines preserved by rollup)
      contents = contents.replaceAll(
        'return Reflect.get(target, prop, receiver);\n\t}\n\treturn Reflect.get(processModule, prop, receiver)',
        'return Reflect.get(target, prop, receiver);\n\t}\n\treturn Reflect.get(processModule, prop, processModule)',
      )

      // Fix minified output (ternary form)
      contents = contents.replace(
        RE_REFLECT_HAS_MINIFIED,
        'Reflect.has($1,$2)?Reflect.get($1,$2,$3):Reflect.get($4,$2,$4)',
      )

      if (contents !== original)
        await writeFile(serverEntry, contents, { encoding: 'utf-8' })
    })
  })
}
