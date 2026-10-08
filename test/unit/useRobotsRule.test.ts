import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRobotsRule } from '../../src/runtime/app/composables/useRobotsRule'
import { ROBOT_DIRECTIVE_VALUES } from '../../src/runtime/const'

const { event, header, useHead } = vi.hoisted(() => ({ event: { context: { robots: { rule: 'index, follow', indexable: true } } }, header: { value: 'index, follow' }, useHead: vi.fn() }))
vi.mock('nuxt/app', () => ({
  injectHead: () => ({}),
  useHead,
  useRequestEvent: () => event,
  useResponseHeader: () => header,
  useRuntimeConfig: () => ({ 'nuxt-robots': { header: true, robotsEnabledValue: ROBOT_DIRECTIVE_VALUES.enabled, robotsDisabledValue: ROBOT_DIRECTIVE_VALUES.disabled } }),
}))
vi.mock('#build/nuxt.config.mjs', () => ({ devRootDir: '' }))
vi.mock('@nuxtjs/robots/util', async () => await vi.importActual('../../src/util'))

describe('useRobotsRule', () => {
  beforeEach(() => {
    event.context.robots = { rule: 'index, follow', indexable: true }
    header.value = 'index, follow'
    delete (event.context as any).siteConfig
    useHead.mockClear()
  })
  it.each([undefined, null])('keeps the existing rule for an unset value', (value) => {
    const robots = useRobotsRule(value as any)
    expect(robots.value).toBe('index, follow')
    expect(header.value).toBe('index, follow')
    expect(useHead).not.toHaveBeenCalled()
  })
  it.each(['noai', 'noimageai', 'noindex, nofollow'])('sets the header and meta for %s', (value) => {
    const robots = useRobotsRule(value)
    expect(robots.value).toBe(value)
    expect(header.value).toBe(value)
    expect(useHead).toHaveBeenCalledWith(expect.objectContaining({ meta: [expect.objectContaining({ content: value })] }), expect.anything())
  })
  it.each([true, false])('maps boolean %s to the default directive', (value) => {
    expect(useRobotsRule(value).value).toBe(value ? ROBOT_DIRECTIVE_VALUES.enabled : ROBOT_DIRECTIVE_VALUES.disabled)
  })
})

it.each([{ env: 'staging' }, { env: 'production', indexable: false }])('preserves site noindex when true is supplied', (site) => {
  ;(event.context as any).siteConfig = { get: () => site }
  expect(useRobotsRule(true).value).toBe(ROBOT_DIRECTIVE_VALUES.disabled)
  delete (event.context as any).siteConfig
})
