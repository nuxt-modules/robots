// Main exports for the bot detection library
export type {
  BotDetectionConfig,
  BotDetectionRequest,
  BotDetectionResponse,
  BotDetectionStorage,
  SessionData,
  IPData,
  SiteProfile,
  DetectionContext,
  SessionIdentifier,
  ResponseStatusProvider,
  BehaviorConfiguration
} from './types'

export { BotDetectionEngine } from './core'

// Storage adapters
export { UnstorageAdapter } from './adapters/unstorage'
export { MemoryAdapter } from './adapters/memory'
export { UnstorageBehaviorAdapter, type BehaviorStorage } from './adapters/behavior-storage'

// H3/Nuxt adapters
export {
  h3ToBotDetectionRequest,
  H3SessionIdentifier,
  H3RealSessionIdentifier,
  H3ResponseStatusProvider,
  createTrackedBotDetectionRequest
} from './adapters/h3'

// Behavior system (still available for direct use)
export { 
  modularBotAnalysis,
  setBehaviorConfig,
  DEFAULT_BEHAVIOR_CONFIG,
  type BotDetectionBehaviorConfig
} from './modular-analyzer'

// Individual behaviors (for custom implementations)
export * from './behaviors'

// Utility functions for common bot detection patterns
export function isBotUserAgent(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

export function isSensitivePath(path: string): boolean {
  const sensitivePaths = [
    '/wp-login',
    '/xmlrpc.php',
    '/.env',
    '/phpmyadmin',
    '/admin',
    '/wp-admin'
  ]
  
  return sensitivePaths.some(sensitive => path.includes(sensitive))
}

export function isValidUserAgent(userAgent: string): boolean {
  return userAgent.length >= 20 && 
         userAgent.includes('Mozilla') && 
         (userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Safari'))
}