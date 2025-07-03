// User intent analysis behavior
import type { SessionData } from '../behavior'

/**
 * Simple pattern detection for obvious bot behavior
 * Low complexity, high confidence
 */
export function analyzeSimplePatterns(sessionData: SessionData): { score: number, reason: string } {
  if (sessionData.lastRequests.length < 5) {
    return { score: 0, reason: 'insufficient-data' }
  }

  const paths = sessionData.lastRequests.map(r => r.path)

  // Check for obvious scanning patterns
  const scanningIndicators = [
    /\/admin/,
    /\/wp-admin/,
    /\/login/,
    /\.php$/,
    /\.asp$/,
    /config/,
    /backup/,
  ]

  let scanningHits = 0
  for (const path of paths) {
    for (const pattern of scanningIndicators) {
      if (pattern.test(path)) {
        scanningHits++
        break
      }
    }
  }

  // If more than 50% of requests hit scanning patterns
  if (scanningHits / paths.length > 0.5) {
    return { score: 35, reason: `scanning-pattern: ${scanningHits}/${paths.length} hits` }
  }

  // Check for sequential numeric patterns (id scanning)
  const numericPaths = paths.filter(p => /\/\d+/.test(p))
  if (numericPaths.length >= 3) {
    const numbers = numericPaths.map((p) => {
      const match = p.match(/\/(\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    }).sort((a, b) => a - b)

    // Check if sequential
    let sequential = true
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i - 1] + 1) {
        sequential = false
        break
      }
    }

    if (sequential) {
      return { score: 40, reason: 'sequential-id-scanning' }
    }
  }

  return { score: 0, reason: 'normal-patterns' }
}

/**
 * Advanced intent recognition with multiple behavioral indicators
 * High complexity, higher chance of false positives
 */
export function analyzeAdvancedIntent(sessionData: SessionData): { score: number, reason: string } {
  if (sessionData.lastRequests.length < 8) {
    return { score: 0, reason: 'insufficient-data' }
  }

  const paths = sessionData.lastRequests.map(r => r.path)
  const recentPaths = paths.slice(-10)

  // Analyze navigation patterns
  const navAnalysis = analyzeNavigationPatterns(recentPaths)
  if (navAnalysis.suspicious) {
    return { score: navAnalysis.score, reason: navAnalysis.reason }
  }

  // Analyze path diversity
  const diversityAnalysis = analyzePathDiversity(recentPaths)
  if (diversityAnalysis.suspicious) {
    return { score: diversityAnalysis.score, reason: diversityAnalysis.reason }
  }

  // Analyze error patterns
  const errorAnalysis = analyzeErrorPatterns(sessionData.lastRequests)
  if (errorAnalysis.suspicious) {
    return { score: errorAnalysis.score, reason: errorAnalysis.reason }
  }

  return { score: 0, reason: 'normal-advanced-intent' }
}

function analyzeNavigationPatterns(paths: string[]): { suspicious: boolean, score: number, reason: string } {
  // Check for logical navigation flow
  const hasLogicalFlow = checkLogicalFlow(paths)
  if (!hasLogicalFlow) {
    // Check if it's random or systematic
    const pathSet = new Set(paths)
    const uniqueRatio = pathSet.size / paths.length

    if (uniqueRatio > 0.9) {
      return { suspicious: true, score: 25, reason: 'random-navigation-pattern' }
    }

    // Check for alphabetical ordering
    const sorted = [...paths].sort()
    const isAlphabetical = paths.join('') === sorted.join('')
    if (isAlphabetical) {
      return { suspicious: true, score: 30, reason: 'alphabetical-scanning' }
    }
  }

  return { suspicious: false, score: 0, reason: 'normal-navigation' }
}

function analyzePathDiversity(paths: string[]): { suspicious: boolean, score: number, reason: string } {
  const sections = new Set(paths.map(p => `/${p.split('/')[1]}`).filter(Boolean))

  // Too many different sections too quickly
  if (sections.size > paths.length * 0.7 && paths.length > 5) {
    return { suspicious: true, score: 20, reason: 'excessive-path-diversity' }
  }

  // All requests to same deep path structure
  const pathStructures = paths.map(p => p.split('/').slice(0, 3).join('/'))
  const structureSet = new Set(pathStructures)
  if (structureSet.size === 1 && paths.length > 6) {
    return { suspicious: true, score: 15, reason: 'narrow-path-focus' }
  }

  return { suspicious: false, score: 0, reason: 'normal-diversity' }
}

function analyzeErrorPatterns(requests: Array<{ path: string, status?: number }>): { suspicious: boolean, score: number, reason: string } {
  const recentRequests = requests.slice(-10)
  const errorCount = recentRequests.filter(r => r.status && r.status >= 400).length

  // Too many errors suggests probing
  if (errorCount > recentRequests.length * 0.6) {
    return { suspicious: true, score: 25, reason: 'excessive-error-generation' }
  }

  // No errors at all can also be suspicious for exploration
  if (errorCount === 0 && recentRequests.length > 8) {
    const uniquePaths = new Set(recentRequests.map(r => r.path))
    if (uniquePaths.size === recentRequests.length) {
      return { suspicious: true, score: 10, reason: 'error-free-exploration' }
    }
  }

  return { suspicious: false, score: 0, reason: 'normal-error-pattern' }
}

function checkLogicalFlow(paths: string[]): boolean {
  // Very simple check for logical navigation
  const hasHome = paths.some(p => p === '/' || p === '')
  const hasDeepPaths = paths.some(p => p.split('/').length > 3)

  // Basic logical flow: start at home or main sections, then go deeper
  if (hasHome && hasDeepPaths) {
    return true
  }

  // Check for common navigation patterns
  const commonPatterns = [
    /^\/$/, // Home
    /^\/[^/]+$/, // Main section
    /^\/[^/]+\/[^/]+$/, // Subsection
  ]

  const patternMatches = commonPatterns.map(pattern =>
    paths.some(path => pattern.test(path)),
  )

  // If matches multiple levels, consider it logical
  return patternMatches.filter(Boolean).length >= 2
}
