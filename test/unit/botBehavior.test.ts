import type { IPData, SessionData } from '../../src/runtime/server/lib/is-bot/behavior'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeBehavior,
  BEHAVIOR_WEIGHTS,
  BOT_SCORE_THRESHOLDS,
  TrafficType,
} from '../../src/runtime/server/lib/is-bot/behavior'

describe('bot Detection Analysis', () => {
  // Mock storage for testing
  const mockStorage = {
    getItem: vi.fn(),
    setItem: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper function to create clean session data
  const createCleanSessionData = (overrides = {}): SessionData => ({
    lastRequests: [],
    suspiciousPathHits: 0,
    maybeSensitivePathHits: 0,
    uniqueSensitivePathsAccessed: [],
    errorCount: 0,
    score: 0,
    lastUpdated: Date.now() - 60000, // 1 minute ago
    trafficType: TrafficType.UNKNOWN,
    knownGoodActions: 0,
    requestMethodVariety: [],
    requestSequenceEntropy: 0,
    firstSeenAt: Date.now() - 60000, // 1 minute ago,
    ...overrides,
  })

  // Helper function to create clean IP data
  const createCleanIPData = (overrides = {}): IPData => ({
    sessionCount: 1,
    activeSessions: ['test-session'],
    suspiciousScore: 0,
    lastUpdated: Date.now() - 60000,
    whitelisted: false,
    blacklisted: false,
    legitSessionsCount: 0,
    lastSessionCreated: Date.now() - 60000,
    ...overrides,
  })

  it('should identify a bot accessing a sensitive path', async () => {
    // Setup mock storage responses
    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData())
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData())
      }
      return Promise.resolve(null)
    })

    // Test accessing a sensitive path
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/wp-admin/index.php',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
    })

    // Assertions
    expect(result.factors).toHaveProperty('SENSITIVE_PATH')
    expect(result.score).toBe(BEHAVIOR_WEIGHTS.SENSITIVE_PATH)
    expect(result.isLikelyBot).toBe(false) // Single hit shouldn't trigger "likely bot"
  })

  it('should identify a bot accessing multiple sensitive paths', async () => {
    // Mock existing session with previous sensitive path hit
    const existingSession = createCleanSessionData({
      suspiciousPathHits: 1,
      score: BEHAVIOR_WEIGHTS.SENSITIVE_PATH,
      lastRequests: [
        {
          timestamp: Date.now() - 30000,
          path: '/wp-login',
          method: 'GET',
        },
      ],
    })

    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(existingSession)
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData())
      }
      return Promise.resolve(null)
    })

    // Test accessing another sensitive path
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/wp-admin/index.php',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
    })

    // Two sensitive path hits should increase score
    expect(result.factors).toHaveProperty('SENSITIVE_PATH')
    expect(result.score).toBeGreaterThan(BEHAVIOR_WEIGHTS.SENSITIVE_PATH)
    // Still not enough to be considered a likely bot
    expect(result.isLikelyBot).toBe(false)
  })

  it('should identify a bot accessing maybe-sensitive paths', async () => {
    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData())
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData())
      }
      return Promise.resolve(null)
    })

    // Test accessing a maybe-sensitive path
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/admin',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
    })

    // Should have a lower score than sensitive path
    expect(result.factors).toHaveProperty('MAYBE_SENSITIVE_PATH')
    expect(result.score).toBe(BEHAVIOR_WEIGHTS.MAYBE_SENSITIVE_PATH)
    expect(result.isLikelyBot).toBe(false)
  })

  it('should identify a bot accessing multiple different maybe-sensitive paths', async () => {
    // Mock session with a previous maybe-sensitive path hit
    const existingSession = createCleanSessionData({
      maybeSensitivePathHits: 1,
      uniqueSensitivePathsAccessed: ['/login'],
      score: BEHAVIOR_WEIGHTS.MAYBE_SENSITIVE_PATH,
      lastRequests: [
        {
          timestamp: Date.now() - 30000,
          path: '/login',
          method: 'GET',
        },
      ],
    })

    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(existingSession)
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData())
      }
      return Promise.resolve(null)
    })

    // Test accessing another maybe-sensitive path
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/admin',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
    })

    // Should have detected multiple sensitive paths hit
    expect(result.factors).toHaveProperty('MAYBE_SENSITIVE_PATH')
    expect(result.factors).toHaveProperty('MULTIPLE_SENSITIVE_HITS')
    expect(result.score).toBeGreaterThan(BEHAVIOR_WEIGHTS.MAYBE_SENSITIVE_PATH * 2)
    expect(result.sensitivePaths).toContain('/login')
    expect(result.sensitivePaths).toContain('/admin')
  })

  it('should detect rapid requests', async () => {
    // Create session with many recent requests
    const now = Date.now()
    const recentRequests = Array.from({ length: 20 }, (_, i) => ({
      timestamp: now - (i * 2000), // One request every 2 seconds
      path: `/page${i}`,
      method: 'GET',
    }))

    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData({
          lastRequests: recentRequests,
          lastUpdated: now - 40000,
        }))
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData())
      }
      return Promise.resolve(null)
    })

    // Test another request coming in
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/another-page',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
      timestamp: now,
    })

    // Should detect rapid requests
    expect(result.factors).toHaveProperty('RAPID_REQUESTS')
    expect(result.isLikelyBot).toBe(false) // Not enough for likely bot yet
  })

  it('should detect abnormal request timing patterns', async () => {
    // Create session with suspiciously consistent timing
    const now = Date.now()
    const consistentRequests = Array.from({ length: 10 }, (_, i) => ({
      timestamp: now - ((i + 1) * 1000), // Exactly 1 second between each request
      timeSincePrevious: i > 0 ? 1000 : undefined, // Exactly 1 second
      path: `/page${i}`,
      method: 'GET',
    }))

    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData({
          lastRequests: consistentRequests,
          lastUpdated: now - 10000,
        }))
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData())
      }
      return Promise.resolve(null)
    })

    // Test another perfectly timed request
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/another-page',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
      timestamp: now,
    })

    // Should detect suspicious timing
    expect(result.factors).toHaveProperty('RESOURCE_TIMING')
  })

  it('should detect unusual request sequence patterns', async () => {
    // Create session with unusual sequential access pattern
    const now = Date.now()
    // Sequential URLs that look like scanning
    const scanningRequests = [
      { timestamp: now - 50000, path: '/page1', method: 'GET' },
      { timestamp: now - 40000, path: '/page2', method: 'GET' },
      { timestamp: now - 30000, path: '/page3', method: 'GET' },
      { timestamp: now - 20000, path: '/page4', method: 'GET' },
      { timestamp: now - 10000, path: '/page5', method: 'GET' },
    ]

    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData({
          lastRequests: scanningRequests,
          lastUpdated: now - 50000,
        }))
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData())
      }
      return Promise.resolve(null)
    })

    // Test continuing the pattern
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/page6',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
      timestamp: now,
    })

    // Should detect unusual pattern
    expect(result.factors).toHaveProperty('UNUSUAL_PATTERN')
  })

  it('should respect IP whitelisting', async () => {
    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData())
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData({
          whitelisted: true,
        }))
      }
      return Promise.resolve(null)
    })

    // Test a whitelisted IP
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/wp-admin/index.php', // Sensitive path that would normally trigger
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
    })

    // Should be whitelisted
    expect(result.whitelisted).toBe(true)
    expect(result.score).toBe(0)
    expect(result.isLikelyBot).toBe(false)
    // Should not have called setItem
    expect(mockStorage.setItem).not.toHaveBeenCalled()
  })

  it('should respect IP blacklisting', async () => {
    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData())
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData({
          blacklisted: true,
        }))
      }
      return Promise.resolve(null)
    })

    // Test a blacklisted IP with innocent path
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/about-us', // Innocent path that would normally not trigger
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
    })

    // Should be blacklisted
    expect(result.blacklisted).toBe(true)
    expect(result.score).toBe(100)
    expect(result.isLikelyBot).toBe(true)
    // Should not have called setItem
    expect(mockStorage.setItem).not.toHaveBeenCalled()
  })

  it('should detect session anomalies', async () => {
    // Create IP with many active sessions
    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData({
          firstSeenAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours old
        }))
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData({
          activeSessions: Array.from({ length: 15 }, (_, i) => `session-${i}`),
          sessionCount: 15,
          sessionsPerHour: 6,
        }))
      }
      return Promise.resolve(null)
    })

    // Test with a session from this IP
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/some-page',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
    })

    // Should detect session anomaly
    expect(result.factors).toHaveProperty('SESSION_ANOMALY')
    expect(result.sessionAge).toBeGreaterThan(24 * 60 * 60 * 1000) // > 24 hours
  })

  it('should reduce score for natural browsing patterns', async () => {
    // Create session with natural browsing pattern
    const now = Date.now()
    const naturalRequests = [
      { timestamp: now - 50000, path: '/', method: 'GET' },
      { timestamp: now - 42000, path: '/products', method: 'GET' },
      { timestamp: now - 31000, path: '/products/item1', method: 'GET' },
      { timestamp: now - 25000, path: '/products/item2', method: 'GET' },
      { timestamp: now - 10000, path: '/about', method: 'GET' },
    ]

    // Session with some initial score from previous activity
    const initialScore = 20

    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(createCleanSessionData({
          lastRequests: naturalRequests,
          score: initialScore,
          lastUpdated: now - 50000,
        }))
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData())
      }
      return Promise.resolve(null)
    })

    // Test normal browsing continuation
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/contact',
      method: 'GET',
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
      timestamp: now,
    })

    // Score should be reduced for natural browsing
    expect(result.score).toBeLessThan(initialScore)
    expect(result.isLikelyBot).toBe(false)
    expect(result.legitActions).toBeGreaterThan(0)
  })

  it('should identify a definite bot with high score accumulation', async () => {
    // Mock existing session with high suspicious activity
    const existingSession = createCleanSessionData({
      suspiciousPathHits: 3,
      maybeSensitivePathHits: 2,
      uniqueSensitivePathsAccessed: ['/wp-login', '/wp-admin', '/phpmyadmin'],
      score: 65, // Close to likely bot threshold
      lastRequests: Array.from({ length: 15 }, (_, i) => ({
        timestamp: Date.now() - (i * 2000),
        path: i % 2 === 0 ? `/wp-content/page${i}` : `/wp-admin/script${i}`,
        method: 'GET',
      })),
    })

    mockStorage.getItem.mockImplementation((key: string) => {
      if (key === 'session:test-session') {
        return Promise.resolve(existingSession)
      }
      else if (key === 'ip:1.2.3.4') {
        return Promise.resolve(createCleanIPData({
          suspiciousScore: 40,
        }))
      }
      return Promise.resolve(null)
    })

    // Hit another sensitive path to push over threshold
    const result = await analyzeBehavior({
      ip: '1.2.3.4',
      path: '/xmlrpc.php',
      method: 'POST', // Suspicious POST to xmlrpc
      storage: mockStorage,
      session: { id: 'test-session' },
      headers: { accept: 'text/html' },
    })

    // Should now be classified as a likely bot
    expect(result.score).toBeGreaterThanOrEqual(BOT_SCORE_THRESHOLDS.LIKELY_BOT)
    expect(result.isLikelyBot).toBe(true)
    expect(result.trafficType).toBe(TrafficType.MALICIOUS_BOT)
    expect(result.factors).toHaveProperty('SENSITIVE_PATH')
  })
})
