// Modular bot detection behaviors
// Each behavior can be enabled/disabled and configured independently

export * from './intent-analysis'
export * from './path-analysis'
export * from './positive-signals'
export * from './rate-limiting'
export * from './timing-analysis'
export * from './user-agent-analysis'

// Behavior categories by complexity and reliability
export const SIMPLE_BEHAVIORS = {
  // High reliability, low complexity - recommended for production
  pathAnalysis: 'analyzePathAccess',
  basicTiming: 'analyzeBasicTiming',
  basicRateLimit: 'analyzeBasicRateLimit',
  basicUserAgent: 'analyzeBasicUserAgent',
  simplePatterns: 'analyzeSimplePatterns',
  basicPositiveSignals: 'analyzeBasicPositiveSignals',
} as const

export const INTERMEDIATE_BEHAVIORS = {
  // Medium complexity, good reliability - use with caution
  burstDetection: 'analyzeBurstPattern',
  headerConsistency: 'analyzeHeaderConsistency',
  contextualRateLimit: 'analyzeContextualRateLimit',
} as const

export const ADVANCED_BEHAVIORS = {
  // High complexity, higher error rate - experimental
  advancedTiming: 'analyzeAdvancedTiming',
  advancedIntent: 'analyzeAdvancedIntent',
  browserFingerprint: 'analyzeBrowserFingerprint',
  advancedPositiveSignals: 'analyzeAdvancedPositiveSignals',
  behavioralCredibility: 'analyzeBehavioralCredibility',
} as const

// Configuration interface
export interface BehaviorConfig {
  enabled: boolean
  weight: number // Multiplier for the behavior's score
  threshold?: number // Custom threshold for this behavior
}

export interface BotDetectionBehaviorConfig {
  simple: Record<keyof typeof SIMPLE_BEHAVIORS, BehaviorConfig>
  intermediate: Record<keyof typeof INTERMEDIATE_BEHAVIORS, BehaviorConfig>
  advanced: Record<keyof typeof ADVANCED_BEHAVIORS, BehaviorConfig>
}

// Default configuration - only simple behaviors enabled
export const DEFAULT_BEHAVIOR_CONFIG: BotDetectionBehaviorConfig = {
  simple: {
    pathAnalysis: { enabled: true, weight: 1.0 },
    basicTiming: { enabled: true, weight: 1.0 },
    basicRateLimit: { enabled: true, weight: 1.0 },
    basicUserAgent: { enabled: true, weight: 1.0 },
    simplePatterns: { enabled: true, weight: 1.0 },
    basicPositiveSignals: { enabled: true, weight: 1.0 },
  },
  intermediate: {
    burstDetection: { enabled: false, weight: 0.8 },
    headerConsistency: { enabled: false, weight: 0.7 },
    contextualRateLimit: { enabled: false, weight: 0.9 },
  },
  advanced: {
    advancedTiming: { enabled: false, weight: 0.6 },
    advancedIntent: { enabled: false, weight: 0.5 },
    browserFingerprint: { enabled: false, weight: 0.4 },
    advancedPositiveSignals: { enabled: false, weight: 0.6 },
    behavioralCredibility: { enabled: false, weight: 0.3 },
  },
}
