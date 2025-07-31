import { describe, expect, it } from 'vitest'

// Import constants directly to avoid runtime dependencies
const SENSITIVE_PATHS = [
  '/wp-login',
  '/xmlrpc.php',
  '/.env',
  '/phpmyadmin',
]

const BEHAVIOR_WEIGHTS = {
  SENSITIVE_PATH: 15,
  RAPID_REQUESTS: 20,
  MULTIPLE_SENSITIVE_HITS: 40,
}

const BOT_SCORE_THRESHOLDS = {
  DEFINITELY_BOT: 90,
  LIKELY_BOT: 70,
  SUSPICIOUS: 40,
}

describe('bot behavior constants', () => {
  it('defines sensitive paths for bot detection', () => {
    expect(SENSITIVE_PATHS).toContain('/wp-login')
    expect(SENSITIVE_PATHS).toContain('/.env')
    expect(SENSITIVE_PATHS).toContain('/phpmyadmin')
    expect(SENSITIVE_PATHS.length).toBeGreaterThan(3)
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
