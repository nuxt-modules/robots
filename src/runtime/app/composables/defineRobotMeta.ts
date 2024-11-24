import { consola } from 'consola'
import { basename, dirname, join } from 'pathe'
import { getCurrentInstance } from 'vue'

/**
 * @deprecated The robots meta tag is now enabled by default.
 */
export function defineRobotMeta(component?: boolean) {
  // handle deprecation
  const vm = getCurrentInstance()
  if (vm) {
    const src = (component ? vm?.parent?.type?.__file : vm?.type?.__file) || ''
    const filePath = join(dirname(src).split('/').pop() || '', basename(src))
    consola.warn(`[Nuxt Robots] The \`<meta name="robots">\` tag is now enabled by default. \`${component ? '<RobotsMeta />' : 'defineRobotMeta()'}\` is deprecated, you should remove it from \`${filePath}\`.`)
  }
}
