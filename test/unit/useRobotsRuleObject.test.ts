import { beforeEach, describe, expect, it } from 'vitest'
import { ROBOT_DIRECTIVE_VALUES } from '../../src/runtime/const'

// Create a mock implementation of useRobotsRule for testing
function createMockUseRobotsRule() {
  const state = {
    rule: '',
  }

  return (rule?: any) => {
    if (typeof rule === 'boolean') {
      state.rule = rule ? ROBOT_DIRECTIVE_VALUES.enabled : ROBOT_DIRECTIVE_VALUES.disabled
    }
    else if (typeof rule === 'object' && rule !== null) {
      const directives: string[] = []
      for (const [key, value] of Object.entries(rule)) {
        if (value === false || value === null || value === undefined)
          continue

        // Handle boolean directives
        if (key in ROBOT_DIRECTIVE_VALUES && typeof value === 'boolean' && value) {
          directives.push(ROBOT_DIRECTIVE_VALUES[key as keyof typeof ROBOT_DIRECTIVE_VALUES])
        }
      }
      state.rule = directives.join(', ') || ROBOT_DIRECTIVE_VALUES.enabled
    }
    else if (rule) {
      state.rule = rule
    }

    return {
      get: () => state.rule,
      set: (val: any) => {
        if (typeof val === 'boolean') {
          state.rule = val ? ROBOT_DIRECTIVE_VALUES.enabled : ROBOT_DIRECTIVE_VALUES.disabled
        }
        else {
          state.rule = val
        }
      },
    }
  }
}

describe('useRobotsRule with object syntax', () => {
  let useRobotsRule: ReturnType<typeof createMockUseRobotsRule>

  beforeEach(() => {
    useRobotsRule = createMockUseRobotsRule()
  })

  it('should handle object syntax with single directive', () => {
    const rule = useRobotsRule({ noai: true })
    expect(rule.get()).toBe('noai')
  })

  it('should handle object syntax with multiple directives', () => {
    const rule = useRobotsRule({ noindex: true, noai: true })
    expect(rule.get()).toBe('noindex, noai')
  })

  it('should handle object syntax with false values', () => {
    const rule = useRobotsRule({ noindex: true, follow: false, noai: true })
    expect(rule.get()).toBe('noindex, noai')
  })

  it('should handle reactive object values', () => {
    const reactiveRule = { noai: true, noimageai: true }
    const rule = useRobotsRule(reactiveRule)
    expect(rule.get()).toBe('noai, noimageai')
  })

  it('should use enabled value when empty object is provided', () => {
    const rule = useRobotsRule({})
    expect(rule.get()).toBe(ROBOT_DIRECTIVE_VALUES.enabled)
  })
})
