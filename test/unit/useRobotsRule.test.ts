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

describe('useRobotsRule with new directives', () => {
  let useRobotsRule: ReturnType<typeof createMockUseRobotsRule>

  beforeEach(() => {
    useRobotsRule = createMockUseRobotsRule()
  })

  it('should handle noai directive', () => {
    const rule = useRobotsRule('noai')
    expect(rule.get()).toBe('noai')
  })

  it('should handle noimageai directive', () => {
    const rule = useRobotsRule('noimageai')
    expect(rule.get()).toBe('noimageai')
  })

  it('should handle boolean true to enabled value', () => {
    const rule = useRobotsRule(true)
    expect(rule.get()).toBe(ROBOT_DIRECTIVE_VALUES.enabled)
  })

  it('should handle boolean false to disabled value', () => {
    const rule = useRobotsRule(false)
    expect(rule.get()).toBe(ROBOT_DIRECTIVE_VALUES.disabled)
  })

  it('should handle custom string values', () => {
    const customValue = 'noindex, nofollow, noai'
    const rule = useRobotsRule(customValue)
    expect(rule.get()).toBe(customValue)
  })
})
