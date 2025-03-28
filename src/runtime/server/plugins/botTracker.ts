import { defineNitroPlugin } from 'nitropack/runtime'
import type { DailyBotStats } from '#robots/types'

interface BotVisit {
  userAgent: string
  path: string
  timestamp: number
  score: number
}

// In-memory storage for bot visits
const botStats: DailyBotStats = {}

// Bot types classification
const KNOWN_SEARCH_BOTS = [
  { pattern: 'googlebot', name: 'googlebot', reputation: 'trusted' },
  { pattern: 'bingbot', name: 'bingbot', reputation: 'trusted' },
  { pattern: 'yandexbot', name: 'yandexbot', reputation: 'trusted' },
  { pattern: 'baiduspider', name: 'baiduspider', reputation: 'trusted' },
  { pattern: 'duckduckbot', name: 'duckduckbot', reputation: 'trusted' },
  { pattern: 'slurp', name: 'yahoo', reputation: 'trusted' },
]

const SOCIAL_BOTS = [
  { pattern: 'twitterbot', name: 'twitter', reputation: 'trusted' },
  { pattern: 'facebookexternalhit', name: 'facebook', reputation: 'trusted' },
  { pattern: 'linkedinbot', name: 'linkedin', reputation: 'trusted' },
]

const SEO_BOTS = [
  { pattern: 'mj12bot', name: 'majestic12', reputation: 'neutral' },
  { pattern: 'ahrefsbot', name: 'ahrefs', reputation: 'neutral' },
  { pattern: 'semrushbot', name: 'semrush', reputation: 'neutral' },
]

const AI_BOTS = [
  { pattern: 'anthropic', name: 'anthropic', reputation: 'neutral' },
  { pattern: 'claude', name: 'claude', reputation: 'neutral' },
  { pattern: 'gptbot', name: 'gpt', reputation: 'neutral' },
  { pattern: 'cohere', name: 'cohere', reputation: 'neutral' },
]

const SUSPICIOUS_PATTERNS = [
  { pattern: 'python-requests', name: 'requests', reputation: 'suspicious' },
  { pattern: 'zgrab', name: 'zgrab', reputation: 'malicious' },
  { pattern: 'masscan', name: 'masscan', reputation: 'malicious' },
  { pattern: 'nmap', name: 'nmap', reputation: 'malicious' },
  { pattern: 'nikto', name: 'nikto', reputation: 'malicious' },
  { pattern: 'wpscan', name: 'wpscan', reputation: 'malicious' },
  { pattern: 'wget', name: 'wget', reputation: 'suspicious' },
  { pattern: 'curl', name: 'curl', reputation: 'suspicious' },
]

// Helper to identify bots from user agent and score them
function identifyAndScoreBot(userAgent: string, path: string): { botType: string | null, score: number } {
  if (!userAgent) return { botType: null, score: 0 }
  
  const userAgentLower = userAgent.toLowerCase()
  let score = 0
  let botType = null
  let reputation = 'unknown'
  
  // Check for known search engines (most trusted, score 90-100)
  for (const bot of KNOWN_SEARCH_BOTS) {
    if (userAgentLower.includes(bot.pattern)) {
      botType = bot.name
      reputation = bot.reputation
      score = 95
      break
    }
  }
  
  // Check for social media bots (trusted, score 80-90)
  if (!botType) {
    for (const bot of SOCIAL_BOTS) {
      if (userAgentLower.includes(bot.pattern)) {
        botType = bot.name
        reputation = bot.reputation
        score = 85
        break
      }
    }
  }
  
  // Check for SEO tools (neutral, score 50-70)
  if (!botType) {
    for (const bot of SEO_BOTS) {
      if (userAgentLower.includes(bot.pattern)) {
        botType = bot.name
        reputation = bot.reputation
        score = 60
        break
      }
    }
  }
  
  // Check for AI bots (varies, score 50-70)
  if (!botType) {
    for (const bot of AI_BOTS) {
      if (userAgentLower.includes(bot.pattern)) {
        botType = bot.name
        reputation = bot.reputation
        score = 60
        break
      }
    }
  }
  
  // Check for suspicious patterns (potentially malicious, score 1-30)
  if (!botType) {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (userAgentLower.includes(pattern.pattern)) {
        botType = pattern.name
        reputation = pattern.reputation
        score = reputation === 'malicious' ? 5 : 25
        break
      }
    }
  }
  
  // Generic bot detection (score varies based on characteristics)
  if (!botType && (userAgentLower.includes('bot') || userAgentLower.includes('spider') || userAgentLower.includes('crawler'))) {
    botType = 'other-bot'
    score = 40 // Default score for unknown bot
    
    // Adjust score based on heuristics
    // Missing Accept headers often indicates a bot
    if (!userAgentLower.includes('mozilla')) {
      score -= 10
    }
    
    // Very short user agents are suspicious
    if (userAgent.length < 30) {
      score -= 10
    }
    
    // Known bad paths
    if (path.includes('wp-login') || path.includes('xmlrpc.php') || path.includes('.env') || path.includes('admin')) {
      score -= 15
    }
  }
  
  return { botType, score }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const userAgent = event.node.req.headers['user-agent'] || ''
    const path = event.node.req.url || ''
    const { botType, score } = identifyAndScoreBot(userAgent, path)
    
    // Only track bot visits
    if (!botType) return
    
    // Use waitUntil to not block the response
    event.waitUntil((async () => {
      try {
        const now = new Date()
        const dateKey = now.toISOString().split('T')[0] // YYYY-MM-DD format
        
        // Initialize stats for today if not exists
        if (!botStats[dateKey]) {
          botStats[dateKey] = {
            count: 0,
            bots: {}
          }
        }
        
        // Update stats
        botStats[dateKey].count++
        botStats[dateKey].bots[botType] = (botStats[dateKey].bots[botType] || 0) + 1
        
        // Optional: you could add a scores object to track average scores per bot type
        if (!botStats[dateKey].scores) {
          botStats[dateKey].scores = {}
        }
        
        // Track average score per bot type
        if (!botStats[dateKey].scores[botType]) {
          botStats[dateKey].scores[botType] = { total: 0, count: 0, average: 0 }
        }
        
        botStats[dateKey].scores[botType].total += score
        botStats[dateKey].scores[botType].count++
        botStats[dateKey].scores[botType].average = 
          botStats[dateKey].scores[botType].total / botStats[dateKey].scores[botType].count
        
        // Expose stats on nitroApp
        nitroApp._botStats = botStats
        
        // Optional: Add this bot score to the response headers for debugging
        if (process.env.NODE_ENV === 'development') {
          event.node.res.setHeader('X-Bot-Score', score.toString())
          event.node.res.setHeader('X-Bot-Type', botType)
        }
      } catch (error) {
        console.error('Error tracking bot visit:', error)
      }
    })())
  })
})
