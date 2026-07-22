import type { MaybeRef } from 'vue'
import type { RobotsValue } from '../../types'
import { robotsDirectivesFromObject } from '@nuxtjs/robots/util'
import { setHeader } from 'h3'
import {
  useRequestEvent,
  useRuntimeConfig,
} from 'nuxt/app'
import { computed, getCurrentInstance, onBeforeUnmount, ref, toValue } from 'vue'
import { devRootDir } from '#build/nuxt.config.mjs'
import { injectHead, useHead } from '#imports'

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
  if (import.meta.client && head) {
    // bit hacky but should work fine
    const robotsRef = ref<RobotsValue>(document.querySelector('meta[name="robots"]')?.getAttribute('content') || '')
    const _ = head.hooks?.hook('dom:rendered', () => {
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
      const robotsConfig = config['nuxt-robots'] as any
      finalRule = robotsDirectivesFromObject(_rule).join(', ') || robotsConfig.robotsEnabledValue
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
  return computed<RobotsValue | undefined>({
    set(val) {
      setRobotsRule(val)
    },
    get() {
      return event?.context?.robots?.rule
    },
  })
}
