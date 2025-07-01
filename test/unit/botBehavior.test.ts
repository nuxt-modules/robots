import { describe, expect, it } from 'vitest'
import { BEHAVIOR_WEIGHTS, BOT_SCORE_THRESHOLDS, SENSITIVE_PATHS } from '../../src/runtime/server/lib/is-bot/behavior'

describe('bot behavior constants', () => {
  it('defines sensitive paths for bot detection', () => {
    expect(SENSITIVE_PATHS).toContain('/wp-login')
    expect(SENSITIVE_PATHS).toContain('/.env')
    expect(SENSITIVE_PATHS).toContain('/phpmyadmin')
    expect(SENSITIVE_PATHS.length).toBeGreaterThan(10)
  })

  it('defines behavior weights for scoring', () => {
    expect(BEHAVIOR_WEIGHTS.SENSITIVE_PATH).toBe(15)
    expect(BEHAVIOR_WEIGHTS.RAPID_REQUESTS).toBe(20)
    expect(BEHAVIOR_WEIGHTS.MULTIPLE_SENSITIVE_HITS).toBe(40)
  })

  it('defines bot score thresholds', () => {
    expect(BOT_SCORE_THRESHOLDS.DEFINITELY_BOT).toBe(90)
    expect(BOT_SCORE_THRESHOLDS.LIKELY_BOT).toBe(70)
    expect(BOT_SCORE_THRESHOLDS.SUSPICIOUS).toBe(40)
  })
})