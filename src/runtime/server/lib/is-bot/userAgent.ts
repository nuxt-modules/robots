// src/runtime/server/lib/botd.ts
import type { getHeaders } from 'h3'

// Bot types classification with more detailed patterns
export const KNOWN_SEARCH_BOTS = [
  {
    pattern: 'googlebot',
    name: 'googlebot',
    secondaryPatterns: ['google.com/bot.html'],
  },
  {
    pattern: 'bingbot',
    name: 'bingbot',
    secondaryPatterns: ['msnbot'],
  },
  {
    pattern: 'yandexbot',
    name: 'yandexbot',
  },
  {
    pattern: 'baiduspider',
    name: 'baiduspider',
    secondaryPatterns: ['baidu.com'],
  },
  {
    pattern: 'duckduckbot',
    name: 'duckduckbot',
    secondaryPatterns: ['duckduckgo.com'],
  },
  {
    pattern: 'slurp',
    name: 'yahoo',
  },
]

export const SOCIAL_BOTS = [
  {
    pattern: 'twitterbot',
    name: 'twitter',
    secondaryPatterns: ['twitter'],
  },
  {
    pattern: 'facebookexternalhit',
    name: 'facebook',
    secondaryPatterns: ['facebook.com'],
  },
  {
    pattern: 'linkedinbot',
    name: 'linkedin',
    secondaryPatterns: ['linkedin'],
  },
  {
    pattern: 'pinterestbot',
    name: 'pinterest',
    secondaryPatterns: ['pinterest'],
  },
  {
    pattern: 'discordbot',
    name: 'discord',
    secondaryPatterns: ['discordapp'],
  },
]

export const SEO_BOTS = [
  {
    pattern: 'mj12bot',
    name: 'majestic12',
    secondaryPatterns: ['majestic12.co.uk/bot'],
  },
  {
    pattern: 'ahrefsbot',
    name: 'ahrefs',
    secondaryPatterns: ['ahrefs.com'],
  },
  {
    pattern: 'semrushbot',
    name: 'semrush',
    secondaryPatterns: ['semrush.com/bot'],
  },
  {
    pattern: 'screaming frog',
    name: 'screaming-frog',
    secondaryPatterns: ['screamingfrog.co.uk'],
  },
  {
    pattern: 'rogerbot',
    name: 'moz',
  },
]

export const AI_BOTS = [
  {
    pattern: 'anthropic',
    name: 'anthropic',
  },
  {
    pattern: 'claude',
    name: 'claude',
  },
  {
    pattern: 'gptbot',
    name: 'gpt',
    secondaryPatterns: ['openai.com'],
  },
  {
    pattern: 'googlebot-news',
    name: 'google-news',
  },
  {
    pattern: 'cohere',
    name: 'cohere',
    secondaryPatterns: ['cohere.com'],
  },
  {
    pattern: 'ccbot',
    name: 'commoncrawl',
    secondaryPatterns: ['commoncrawl.org'],
  },
  {
    pattern: 'perplexitybot',
    name: 'perplexity',
    secondaryPatterns: ['perplexity.ai'],
  },
]
// Basic HTTP clients and tools
export const HTTP_TOOL_BOTS = [
  {
    pattern: 'python-requests',
    name: 'requests',
    secondaryPatterns: ['python'],
  },
  {
    pattern: 'wget',
    name: 'wget',
  },
  {
    pattern: 'curl',
    name: 'curl',
    secondaryPatterns: ['curl'],
  },
]

export const SECURITY_SCANNING_BOTS = [
  {
    pattern: 'zgrab',
    name: 'zgrab',
  },
  {
    pattern: 'masscan',
    name: 'masscan',
  },
  {
    pattern: 'nmap',
    name: 'nmap',
    secondaryPatterns: ['insecure.org'],
  },
  {
    pattern: 'nikto',
    name: 'nikto',
  },
  {
    pattern: 'wpscan',
    name: 'wpscan',
  },
]

// Web scraping tools
export const SCRAPING_BOTS = [
  {
    pattern: 'scrapy',
    name: 'scrapy',
    secondaryPatterns: ['scrapy.org'],
  },
]

// Browser automation tools
export const AUTOMATION_BOTS = [
  {
    pattern: 'phantomjs',
    name: 'phantomjs',
  },
  {
    pattern: 'headless',
    name: 'headless-browser',
  },
  {
    pattern: 'playwright',
    name: 'playwright',
  },
  {
    pattern: 'selenium',
    name: 'selenium',
    secondaryPatterns: ['webdriver'],
  },
  {
    pattern: 'puppeteer',
    name: 'puppeteer',
    secondaryPatterns: ['headless'],
  },
]

export const GENERIC_BOTS = [
  {
    pattern: 'bot',
    name: 'generic-bot',
  },
  {
    pattern: 'spider',
    name: 'generic-spider',
  },
  {
    pattern: 'crawler',
    name: 'generic-crawler',
  },
  {
    pattern: 'scraper',
    name: 'generic-scraper',
  },
]

const BotMap = [
  {
    type: 'search-engine',
    bots: KNOWN_SEARCH_BOTS,
    trusted: true,
  },
  {
    type: 'social',
    bots: SOCIAL_BOTS,
    trusted: true,
  },
  {
    type: 'seo',
    bots: SEO_BOTS,
    trusted: true,
  },
  {
    type: 'ai',
    bots: AI_BOTS,
    trusted: true,
  },
  {
    type: 'generic',
    bots: GENERIC_BOTS,
    trusted: false,
  },
  {
    type: 'automation',
    bots: AUTOMATION_BOTS,
    trusted: false,
  },
  {
    type: 'http-tool',
    bots: HTTP_TOOL_BOTS,
    trusted: false,
  },
  {
    type: 'security-scanner',
    bots: SECURITY_SCANNING_BOTS,
    trusted: false,
  },
  {
    type: 'scraping',
    bots: SCRAPING_BOTS,
    trusted: false,
  },
]

export function isBotFromHeaders(headers: ReturnType<typeof getHeaders>): {
  isBot: boolean
  data?: {
    botType: string
    botName: string
    trusted: boolean
  }
} {
  const userAgent = headers['user-agent']
  const suspiciousHeaders: string[] = []

  // Check for missing user-agent
  if (!userAgent) {
    return {
      isBot: true,
      data: {
        botType: 'unknown',
        botName: 'unknown',
        trusted: false,
      },
    }
  }

  const userAgentLower = userAgent.toLowerCase()
  // Check for known bots (existing code)
  for (const def of BotMap) {
    for (const bot of def.bots) {
      const patterns = [bot.pattern]
      if ('secondaryPatterns' in bot && bot.secondaryPatterns) {
        patterns.push(...bot.secondaryPatterns)
      }
      for (const pattern of patterns) {
        if (userAgentLower.includes(pattern)) {
          return {
            isBot: true,
            data: {
              botType: def.type,
              botName: bot.name,
              trusted: def.trusted,
            },
          }
        }
      }
    }
  }

  // Check for header inconsistencies
  const accept = headers.accept
  const acceptLanguage = headers['accept-language']
  const acceptEncoding = headers['accept-encoding']

  // Browsers typically send these headers
  if (!accept)
    suspiciousHeaders.push('missing-accept')
  if (!acceptLanguage)
    suspiciousHeaders.push('missing-accept-language')
  if (!acceptEncoding)
    suspiciousHeaders.push('missing-accept-encoding')

  // Check for mobile/desktop inconsistencies
  const isMobileUserAgent = /mobile|android|iphone|ipad|ipod/i.test(userAgentLower)
  const hasSecChUa = headers['sec-ch-ua']
  const hasSecChUaMobile = headers['sec-ch-ua-mobile']

  if (isMobileUserAgent && hasSecChUaMobile === '?0') {
    suspiciousHeaders.push('mobile-ua-desktop-client-hint')
  }

  if (!isMobileUserAgent && hasSecChUaMobile === '?1') {
    suspiciousHeaders.push('desktop-ua-mobile-client-hint')
  }

  // Check for browser inconsistencies
  if (userAgentLower.includes('chrome') && !hasSecChUa) {
    suspiciousHeaders.push('chrome-ua-missing-client-hints')
  }

  // Bot detected by user agent or suspicious headers
  if (suspiciousHeaders.length > 0) {
    return {
      isBot: true,
      data: {
        botName: 'suspicious-client',
        botType: 'header-anomaly',
        trusted: false,
      },
    }
  }

  return {
    isBot: false,
  }
}
