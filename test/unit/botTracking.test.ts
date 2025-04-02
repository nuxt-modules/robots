import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getBotStats, getDayStats, resetStats, trackBotVisit } from '../../src/runtime/server/lib/bot-db'

describe('bot tracking module', () => {
  // Reset stats before each test
  beforeEach(() => {
    resetStats()
  })

  // Mock Date for consistent testing
  const mockDate = new Date('2025-01-04T12:00:00Z')
  const realDate = global.Date

  beforeEach(() => {
    vi.stubGlobal('Date', class extends realDate {
      constructor(...args) {
        if (args.length === 0) {
          return mockDate
        }
        return new realDate(...args)
      }
    })
  })

  // Restore Date after tests
  afterEach(() => {
    vi.stubGlobal('Date', realDate)
  })

  it('initializes empty stats properly', () => {
    expect(getBotStats()).toEqual({})
  })

  it('tracks a single bot visit correctly', () => {
    trackBotVisit('googlebot', 95, '/', 'search-bot')

    const stats = getBotStats()
    const dateKey = mockDate.toISOString().split('T')[0] // '2025-01-04'

    expect(stats[dateKey]).toBeDefined()
    expect(stats[dateKey].count).toBe(1)
    expect(stats[dateKey].bots.googlebot).toBe(1)
    expect(stats[dateKey].scores.googlebot.average).toBe(95)
    expect(stats[dateKey].hourly[12]).toBe(1) // 12:00 UTC
    expect(stats[dateKey].sources['search-bot']).toBe(1)
  })

  it('tracks multiple bot visits correctly', () => {
    // Track different bots
    trackBotVisit('googlebot', 95, '/', 'search-bot')
    trackBotVisit('bingbot', 96, '/about', 'search-bot')
    trackBotVisit('requests', 15, '/wp-login', 'suspicious-pattern')

    const stats = getBotStats()
    const dateKey = mockDate.toISOString().split('T')[0]

    expect(stats[dateKey].count).toBe(3)
    expect(stats[dateKey].bots.googlebot).toBe(1)
    expect(stats[dateKey].bots.bingbot).toBe(1)
    expect(stats[dateKey].bots.requests).toBe(1)

    // Check score averages
    expect(stats[dateKey].scores.googlebot.average).toBe(95)
    expect(stats[dateKey].scores.bingbot.average).toBe(96)
    expect(stats[dateKey].scores.requests.average).toBe(15)

    // Check sources
    expect(stats[dateKey].sources['search-bot']).toBe(2)
    expect(stats[dateKey].sources['suspicious-pattern']).toBe(1)
  })

  it('tracks human traffic correctly', () => {
    trackBotVisit(null, 85, '/', 'likely-human')

    const stats = getBotStats()
    const dateKey = mockDate.toISOString().split('T')[0]

    expect(stats[dateKey].count).toBe(1)
    expect(stats[dateKey].bots.human).toBe(1)
    expect(stats[dateKey].scores.human.average).toBe(85)
  })

  it('calculates correct average scores for multiple visits', () => {
    // Multiple visits from same bot type with different scores
    trackBotVisit('googlebot', 90, '/', 'search-bot')
    trackBotVisit('googlebot', 98, '/about', 'search-bot')
    trackBotVisit('googlebot', 94, '/contact', 'search-bot')

    const stats = getBotStats()
    const dateKey = mockDate.toISOString().split('T')[0]

    expect(stats[dateKey].scores.googlebot.count).toBe(3)
    expect(stats[dateKey].scores.googlebot.total).toBe(90 + 98 + 94)

    // Average should be rounded to 2 decimal places
    const expectedAvg = Math.round(((90 + 98 + 94) / 3) * 100) / 100
    expect(stats[dateKey].scores.googlebot.average).toBe(expectedAvg)
  })

  it('tracks paths visited', () => {
    trackBotVisit('googlebot', 95, '/page1', 'search-bot')
    trackBotVisit('googlebot', 96, '/page2', 'search-bot')
    trackBotVisit('googlebot', 94, '/page1', 'search-bot') // Repeated path

    const stats = getBotStats()
    const dateKey = mockDate.toISOString().split('T')[0]

    expect(stats[dateKey].paths.googlebot['/page1']).toBe(2)
    expect(stats[dateKey].paths.googlebot['/page2']).toBe(1)
  })

  it('limits the number of unique paths per bot', () => {
    // Track many unique paths to test the limit
    const MAX_PATHS = 100 // Same as in implementation

    for (let i = 0; i < MAX_PATHS + 10; i++) {
      trackBotVisit('bot', 50, `/path${i}`, 'test')
    }

    const stats = getBotStats()
    const dateKey = mockDate.toISOString().split('T')[0]

    // Should only track MAX_PATHS unique paths
    expect(Object.keys(stats[dateKey].paths.bot).length).toBeLessThanOrEqual(MAX_PATHS)
  })

  it('provides specific day stats', () => {
    trackBotVisit('googlebot', 95, '/', 'search-bot')

    const dateKey = mockDate.toISOString().split('T')[0]
    const dayStats = getDayStats(dateKey)

    expect(dayStats).toBeDefined()
    expect(dayStats.count).toBe(1)
    expect(dayStats.bots.googlebot).toBe(1)

    // Test non-existent date
    expect(getDayStats('2000-01-01')).toBeNull()
  })

  it('resets stats correctly', () => {
    trackBotVisit('googlebot', 95, '/', 'search-bot')
    expect(Object.keys(getBotStats()).length).toBeGreaterThan(0)

    resetStats()
    expect(Object.keys(getBotStats()).length).toBe(0)
  })

  it('handles errors gracefully', () => {
    // Mock console.error to test error handling
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Pass invalid data to trigger error
    trackBotVisit('bot', Number.NaN, '/', null)

    expect(mockConsoleError).toHaveBeenCalled()
    mockConsoleError.mockRestore()
  })
})
