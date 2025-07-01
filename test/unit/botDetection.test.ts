import { describe, expect, it } from 'vitest'
import { isBotFromHeaders } from '../../src/util'

const ValidHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'accept-encoding': 'gzip, deflate, br',
  'sec-ch-ua': '"Google Chrome";v="91", "Chromium";v="91", ";Not A Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
}

describe('bot Detection from Headers', () => {
  // Test empty user agent handling
  it('handles empty user agent properly', () => {
    const result = isBotFromHeaders({})
    expect(result.isBot).toBe(false)
  })

  // Test known search bots
  it('identifies Googlebot correctly', () => {
    const result = isBotFromHeaders({
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    })
    expect(result.isBot).toBe(true)
    expect(result.data?.botName).toBe('googlebot')
    expect(result.data?.botCategory).toBe('search-engine')
    expect(result.data?.trusted).toBe(true)
  })

  it('identifies Bingbot correctly', () => {
    const result = isBotFromHeaders({
      'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    })
    expect(result.isBot).toBe(true)
    expect(result.data?.botName).toBe('bingbot')
    expect(result.data?.botCategory).toBe('search-engine')
    expect(result.data?.trusted).toBe(true)
  })

  // Test social bots
  it('identifies Twitter bot correctly', () => {
    const result = isBotFromHeaders({
      'user-agent': 'Twitterbot/1.0',
    })
    expect(result.isBot).toBe(true)
    expect(result.data?.botName).toBe('twitter')
    expect(result.data?.botCategory).toBe('social')
    expect(result.data?.trusted).toBe(true)
  })

  // Test SEO bots
  it('identifies Ahrefs bot correctly', () => {
    const result = isBotFromHeaders({
      'user-agent': 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
    })
    expect(result.isBot).toBe(true)
    expect(result.data?.botName).toBe('ahrefs')
    expect(result.data?.botCategory).toBe('seo')
    expect(result.data?.trusted).toBe(true)
  })

  // Test AI bots
  it('identifies Claude bot correctly', () => {
    const result = isBotFromHeaders({
      'user-agent': 'Mozilla/5.0 (compatible; Claude-Web/1.0; +https://anthropic.com/claude-bot)',
    })
    expect(result.isBot).toBe(true)
    expect(result.data?.botName).toBe('anthropic')
    expect(result.data?.botCategory).toBe('ai')
    expect(result.data?.trusted).toBe(true)
  })

  // Test suspicious patterns
  it('identifies suspicious Python requests correctly', () => {
    const result = isBotFromHeaders({
      'user-agent': 'python-requests/2.28.1',
    })
    expect(result.isBot).toBe(true)
    expect(result.data?.botName).toBe('requests')
    expect(result.data?.botCategory).toBe('http-tool')
    expect(result.data?.trusted).toBe(false)
  })

  it('identifies malicious scan tools correctly', () => {
    const result = isBotFromHeaders({
      'user-agent': 'Mozilla/5.0 zgrab/0.x',
    })
    expect(result.isBot).toBe(true)
    expect(result.data?.botName).toBe('zgrab')
    expect(result.data?.botCategory).toBe('security-scanner')
    expect(result.data?.trusted).toBe(false)
  })

  // Test generic bot detection
  it('identifies generic bots correctly', () => {
    const result = isBotFromHeaders({
      'user-agent': 'SomeRandomBot/1.0',
    })
    expect(result.isBot).toBe(true)
    expect(result.data?.botName).toBe('generic-bot')
    expect(result.data?.botCategory).toBe('generic')
    expect(result.data?.trusted).toBe(false)
  })

  // Test human traffic
  it('identifies likely human traffic', () => {
    const result = isBotFromHeaders(ValidHeaders)
    expect(result.isBot).toBe(false)
  })

  // Test normal browsers without all headers
  it('allows browsers with missing headers', () => {
    // Missing headers should not trigger bot detection
    const result = isBotFromHeaders({
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })

    expect(result.isBot).toBe(false)
  })

  // Test mobile/desktop user agents are not flagged
  it('allows inconsistent user agents', () => {
    const result = isBotFromHeaders({
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Android 10) AppleWebKit/537.36',
      'sec-ch-ua-mobile': '?0',
    })

    expect(result.isBot).toBe(false)
  })
})
