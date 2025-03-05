import type { MaybeRef } from 'vue'
// @ts-expect-error untyped
import { devRootDir } from '#build/nuxt.config.mjs'
import { injectHead, useHead } from '#imports'
import { setHeader } from 'h3'
import {
  useRequestEvent,
  useRuntimeConfig,
} from 'nuxt/app'
import { computed, getCurrentInstance, onBeforeUnmount, ref, toValue } from 'vue'

/**
 * Get and set the current robots rule.
 */
export function useRobotsRule(rule?: MaybeRef<boolean | string>) {
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

  function setRobotsRule(rule: MaybeRef<string | boolean | undefined>) {
    let _rule = toValue(rule)
    if (!event || typeof _rule === 'undefined')
      return
    if (typeof _rule === 'boolean' || !_rule) {
      _rule = _rule ? config['nuxt-robots'].robotsEnabledValue : config['nuxt-robots'].robotsDisabledValue
    }
    event.context.robots.rule = _rule
    if (config['nuxt-robots'].header) {
      setHeader(event, 'X-Robots-Tag', _rule)
    }
    useHead({
      meta: [
        {
          'name': 'robots',
          'content': _rule,
          'data-hint': import.meta.dev ? `useRobotsRule,.${vm ? vm.type?.__file?.split(devRootDir)[1] : ''}` : undefined,
        },
      ],
    }, {
      head,
    })
  }

  setRobotsRule(rule)
  return computed<string | boolean | undefined>({
    set(val) {
      setRobotsRule(val)
    },
    get() {
      return event?.context?.robots?.rule
    },
  })
}
