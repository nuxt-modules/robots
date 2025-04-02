import { describe, expect, it } from 'vitest'
import { identifyAndScoreBot } from '../../src/runtime/server/lib/botd'

const ValidHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
}

describe('botd detection module', () => {
  // Test empty user agent handling
  it('handles empty user agent properly', () => {
    const result = identifyAndScoreBot('/', {})
    expect(result.botType).toBeNull()
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBe(10)
    expect(result.isBotConfidence).toBe(90)
    expect(result.source).toBe('empty-ua')
  })

  // Test known search bots
  it('identifies Googlebot correctly', () => {
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    )
    expect(result.botType).toBe('googlebot')
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBeGreaterThanOrEqual(90)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(80)
    expect(result.source).toBe('search-bot')
  })

  it('identifies Bingbot correctly', () => {
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
    )
    expect(result.botType).toBe('bingbot')
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBeGreaterThanOrEqual(90)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(80)
    expect(result.source).toBe('search-bot')
  })

  // Test social bots
  it('identifies Twitter bot correctly', () => {
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'Twitterbot/1.0' },
    )
    expect(result.botType).toBe('twitter')
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBeGreaterThanOrEqual(80)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(75)
    expect(result.source).toBe('social-bot')
  })

  // Test SEO bots
  it('identifies Ahrefs bot correctly', () => {
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)' },
    )
    expect(result.botType).toBe('ahrefs')
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBeGreaterThanOrEqual(60)
    expect(result.botReputationScore).toBeLessThanOrEqual(70)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(70)
    expect(result.source).toBe('seo-bot')
  })

  // Test AI bots
  it('identifies Claude bot correctly', () => {
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'Mozilla/5.0 (compatible; Claude-Web/1.0; +https://anthropic.com/claude-bot)' },
    )
    expect(result.botType).toBe('anthropic')
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBeGreaterThanOrEqual(65)
    expect(result.botReputationScore).toBeLessThanOrEqual(75)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(75)
    expect(result.source).toBe('ai-bot')
  })

  // Test suspicious patterns
  it('identifies suspicious Python requests correctly', () => {
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'python-requests/2.28.1' },
    )
    expect(result.botType).toBe('requests')
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBeLessThanOrEqual(30)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(80)
    expect(result.source).toBe('suspicious-pattern')
  })

  it('identifies malicious scan tools correctly', () => {
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'Mozilla/5.0 zgrab/0.x' },
    )
    expect(result.botType).toBe('zgrab')
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBeLessThanOrEqual(10)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(80)
    expect(result.source).toBe('suspicious-pattern')
  })

  // Test generic bot detection
  it('identifies generic bots correctly', () => {
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'SomeRandomBot/1.0' },
    )
    expect(result.botType).toBe('other-bot')
    expect(result.isBot).toBe(true)
    expect(result.botReputationScore).toBeLessThanOrEqual(40)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(65)
    expect(result.source).toBe('generic-bot-term')
  })

  // Test path-based scoring adjustments
  it('adjusts isBotConfidence for sensitive paths', () => {
    const normalResult = identifyAndScoreBot(
      '/normal-path',
      ValidHeaders,
    )

    const sensitiveResult = identifyAndScoreBot(
      '/wp-login',
      ValidHeaders,
    )

    expect(sensitiveResult.isBotConfidence).toBeGreaterThan(normalResult.isBotConfidence)
    expect(sensitiveResult.source).toBe('sensitive-path')
  })

  // Test human traffic
  it('identifies likely human traffic', () => {
    const result = identifyAndScoreBot(
      '/',
      ValidHeaders,
    )
    expect(result.botType).toBeNull()
    expect(result.isBot).toBe(false)
    expect(result.botReputationScore).toBe(0)
    expect(result.isBotConfidence).toBe(10)
    expect(result.source).toBe('likely-human')
  })

  // Test header analysis
  it('uses headers for enhanced detection', () => {
    // Missing crucial headers should trigger detection
    const result = identifyAndScoreBot(
      '/',
      { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    )

    expect(result.botType).toBe('suspicious-client')
    expect(result.isBot).toBe(true)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(70)
    expect(result.source).toBe('missing-headers')
  })

  // Test inconsistent user agents
  it('detects inconsistent user agents', () => {
    const result = identifyAndScoreBot(
      '/',
      {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Android 10) AppleWebKit/537.36',
      },
    )

    expect(result.botType).toBe('suspicious-client')
    expect(result.isBot).toBe(true)
    expect(result.isBotConfidence).toBeGreaterThanOrEqual(10)
    expect(result.source).toBe('inconsistent-ua')
  })

  // Test isBotConfidence and bot reputation scoring ranges
  it('follows proper scoring ranges', () => {
    // Test multiple agents to ensure scores stay in proper ranges
    const userAgents = [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15',
      'python-requests/2.25.1',
      'curl/7.64.1',
      'nmap/7.80',
      'SomeBotWithVeryLittleInfo',
    ]

    for (const ua of userAgents) {
      const result = identifyAndScoreBot('/', { 'user-agent': ua })

      // Bot reputation score should be 0-100
      expect(result.botReputationScore).toBeGreaterThanOrEqual(0)
      expect(result.botReputationScore).toBeLessThanOrEqual(100)

      // isBotConfidence should be 0-100
      expect(result.isBotConfidence).toBeGreaterThanOrEqual(0)
      expect(result.isBotConfidence).toBeLessThanOrEqual(100)
    }
  })
})
