import type { MaybeRef } from 'vue'
import { setHeader } from 'h3'
import {
  computed,
  injectHead,
  onBeforeUnmount,
  ref,
  toValue,
  useRequestEvent,
  useRuntimeConfig,
  useServerHead,
} from '#imports'

/**
 * Get and set the current robots rule.
 */
export function useRobotsRule(rule?: MaybeRef<boolean | string>) {
  const head = injectHead()
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
    setHeader(event, 'X-Robots-Tag', _rule)
    useServerHead({
      meta: [
        {
          name: 'robots',
          content: _rule,
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
