/**
 * Bot Detection Constants
 *
 * This file contains all the bot patterns and categories for bot detection.
 * Separated from util.ts for better organization and easier maintenance.
 */

export interface BotPattern {
  pattern: string
  name: string
  secondaryPatterns?: string[]
}

export interface BotCategory {
  type: string
  bots: BotPattern[]
  trusted: boolean
}

export const KNOWN_SEARCH_BOTS: BotPattern[] = [
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

export const SOCIAL_BOTS: BotPattern[] = [
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

export const SEO_BOTS: BotPattern[] = [
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

export const AI_BOTS: BotPattern[] = [
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

export const HTTP_TOOL_BOTS: BotPattern[] = [
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

export const SECURITY_SCANNING_BOTS: BotPattern[] = [
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

export const SCRAPING_BOTS: BotPattern[] = [
  {
    pattern: 'scrapy',
    name: 'scrapy',
    secondaryPatterns: ['scrapy.org'],
  },
]

export const AUTOMATION_BOTS: BotPattern[] = [
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

export const GENERIC_BOTS: BotPattern[] = [
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

export const BOT_MAP: BotCategory[] = [
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
