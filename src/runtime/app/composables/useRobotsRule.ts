import type { MaybeRef } from 'vue'
import type { RobotsValue } from '../../types'
import { devRootDir } from '#build/nuxt.config.mjs'
import { injectHead, useHead } from '#imports'
import { setHeader } from 'h3'
import {
  useRequestEvent,
  useRuntimeConfig,
} from 'nuxt/app'
import { computed, getCurrentInstance, onBeforeUnmount, ref, toValue } from 'vue'
import { formatMaxImagePreview, formatMaxSnippet, formatMaxVideoPreview, ROBOT_DIRECTIVE_VALUES } from '../../const'

/**
 * Reactive robot directive value type
 */
export type ReactiveRobotsValue = MaybeRef<RobotsValue>

/**
 * Get and set the current robots rule.
 * Supports standard directives (index, noindex, follow, nofollow) and
 * non-standard directives like noai and noimageai.
 */
export function useRobotsRule(rule?: ReactiveRobotsValue) {
  const head = injectHead()
  const vm = getCurrentInstance()
  if (import.meta.client) {
    // bit hacky but should work fine
    const robotsRef = ref(document.querySelector('meta[name="robots"]')?.getAttribute('content') || '')
    const _ = head.hooks.hook('dom:rendered', () => {
      robotsRef.value = document.querySelector('meta[name="robots"]')?.getAttribute('content') || ''
    })
    // remove hook
    onBeforeUnmount(_)
    return robotsRef
  }
  const config = useRuntimeConfig()
  const event = useRequestEvent()

  function setRobotsRule(rule: ReactiveRobotsValue | undefined) {
    const _rule = toValue(rule)
    if (!event || typeof _rule === 'undefined')
      return

    let finalRule: string

    // Handle boolean values
    if (typeof _rule === 'boolean') {
      const robotsConfig = config['nuxt-robots'] as any
      finalRule = _rule ? robotsConfig.robotsEnabledValue : robotsConfig.robotsDisabledValue
    }
    // Handle object directive values
    else if (typeof _rule === 'object' && _rule !== null) {
      const directives: string[] = []
      for (const [key, value] of Object.entries(_rule)) {
        if (value === false || value === null || value === undefined)
          continue

        // Handle boolean directives
        if (key in ROBOT_DIRECTIVE_VALUES && typeof value === 'boolean' && value) {
          directives.push(ROBOT_DIRECTIVE_VALUES[key as keyof typeof ROBOT_DIRECTIVE_VALUES])
        }
        // Handle max-image-preview
        else if (key === 'max-image-preview' && typeof value === 'string') {
          directives.push(formatMaxImagePreview(value as 'none' | 'standard' | 'large'))
        }
        // Handle max-snippet
        else if (key === 'max-snippet' && typeof value === 'number') {
          directives.push(formatMaxSnippet(value))
        }
        // Handle max-video-preview
        else if (key === 'max-video-preview' && typeof value === 'number') {
          directives.push(formatMaxVideoPreview(value))
        }
      }
      const robotsConfig = config['nuxt-robots'] as any
      finalRule = directives.join(', ') || robotsConfig.robotsEnabledValue
    }
    // Handle string values
    else {
      finalRule = _rule as string
    }

    event.context.robots.rule = finalRule
    const robotsConfig = config['nuxt-robots'] as any
    if (robotsConfig.header) {
      setHeader(event, 'X-Robots-Tag', finalRule)
    }
    const vmFile = vm?.type?.__file
    useHead({
      meta: [
        {
          'name': 'robots',
          'content': finalRule,
          'data-hint': import.meta.dev ? ['useRobotsRule', `.${vmFile ? vm.type?.__file?.split(devRootDir || '')[1] || '' : ''}`].filter(Boolean).join(',') : undefined,
        },
      ],
    }, {
      head,
    })
  }

  setRobotsRule(rule)
  return computed<string | undefined>({
    set(val) {
      setRobotsRule(val)
    },
    get() {
      return event?.context?.robots?.rule
    },
  })
}
