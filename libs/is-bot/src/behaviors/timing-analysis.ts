// Timing-based bot detection behavior
import type { SessionData } from '../behavior'

/**
 * Basic timing consistency check
 * Simple and reliable - checks for robotic timing patterns
 */
export function analyzeBasicTiming(sessionData: SessionData): { score: number, reason: string } {
  if (sessionData.lastRequests.length < 5) {
    return { score: 0, reason: 'insufficient-data' }
  }

  const intervals = []
  for (let i = 1; i < sessionData.lastRequests.length; i++) {
    const interval = sessionData.lastRequests[i].timestamp - sessionData.lastRequests[i - 1].timestamp
    intervals.push(interval)
  }

  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
  const variance = intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = stdDev / mean

  // Very consistent timing is suspicious
  if (coefficientOfVariation < 0.05 && mean < 2000) {
    return { score: 35, reason: 'robotic-timing-detected' }
  }

  // Somewhat consistent timing
  if (coefficientOfVariation < 0.15 && mean < 1000) {
    return { score: 20, reason: 'suspicious-timing-pattern' }
  }

  return { score: 0, reason: 'human-like-timing' }
}

/**
 * Advanced timing analysis with more complex patterns
 * Higher complexity, may have false positives
 */
export function analyzeAdvancedTiming(sessionData: SessionData): { score: number, reason: string } {
  if (sessionData.lastRequests.length < 10) {
    return { score: 0, reason: 'insufficient-data' }
  }

  const intervals = []
  for (let i = 1; i < sessionData.lastRequests.length; i++) {
    const interval = sessionData.lastRequests[i].timestamp - sessionData.lastRequests[i - 1].timestamp
    intervals.push(interval)
  }

  // Check for periodic patterns (e.g., every 1000ms, 2000ms, etc.)
  const periodicPattern = checkPeriodicPattern(intervals)
  if (periodicPattern.detected) {
    return { score: 40, reason: `periodic-pattern: ${periodicPattern.period}ms` }
  }

  // Check for mathematical progressions
  const progression = checkMathematicalProgression(intervals)
  if (progression.detected) {
    return { score: 30, reason: `mathematical-progression: ${progression.type}` }
  }

  return analyzeBasicTiming(sessionData)
}

function checkPeriodicPattern(intervals: number[]): { detected: boolean, period?: number } {
  const tolerance = 50 // 50ms tolerance

  // Check common periods
  const commonPeriods = [500, 1000, 1500, 2000, 3000, 5000]

  for (const period of commonPeriods) {
    const matches = intervals.filter(interval =>
      Math.abs(interval - period) <= tolerance,
    )

    if (matches.length >= Math.ceil(intervals.length * 0.6)) {
      return { detected: true, period }
    }
  }

  return { detected: false }
}

function checkMathematicalProgression(intervals: number[]): { detected: boolean, type?: string } {
  if (intervals.length < 5)
    return { detected: false }

  // Check arithmetic progression
  const diffs = []
  for (let i = 1; i < intervals.length; i++) {
    diffs.push(intervals[i] - intervals[i - 1])
  }

  const avgDiff = diffs.reduce((sum, val) => sum + val, 0) / diffs.length
  const diffVariance = diffs.reduce((sum, val) => sum + (val - avgDiff) ** 2, 0) / diffs.length

  if (Math.sqrt(diffVariance) < 10 && Math.abs(avgDiff) > 5) {
    return { detected: true, type: 'arithmetic' }
  }

  return { detected: false }
}
