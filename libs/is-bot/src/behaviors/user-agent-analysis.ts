// User agent and header analysis
import type { SessionData } from '../behavior'

/**
 * Basic user agent validation
 * Simple and reliable
 */
export function analyzeBasicUserAgent(headers: Record<string, any>): { score: number, reason: string } {
  const userAgent = headers['user-agent'] || ''

  // Missing user agent
  if (!userAgent) {
    return { score: 30, reason: 'missing-user-agent' }
  }

  // Too short to be real
  if (userAgent.length < 20) {
    return { score: 25, reason: 'suspicious-user-agent-length' }
  }

  // Common bot signatures
  const botSignatures = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
  ]

  for (const pattern of botSignatures) {
    if (pattern.test(userAgent)) {
      return { score: 40, reason: 'bot-signature-detected' }
    }
  }

  return { score: 0, reason: 'normal-user-agent' }
}

/**
 * Advanced header consistency analysis
 * Higher complexity, may have false positives
 */
export function analyzeHeaderConsistency(headers: Record<string, any>): { score: number, reason: string } {
  const userAgent = headers['user-agent'] || ''
  const acceptLanguage = headers['accept-language'] || ''
  const acceptEncoding = headers['accept-encoding'] || ''
  const accept = headers.accept || ''

  let suspiciousCount = 0
  const issues = []

  // Check for basic browser headers
  if (!accept) {
    suspiciousCount++
    issues.push('missing-accept-header')
  }

  if (!acceptLanguage) {
    suspiciousCount++
    issues.push('missing-accept-language')
  }

  if (!acceptEncoding) {
    suspiciousCount++
    issues.push('missing-accept-encoding')
  }

  // Check for inconsistencies
  if (userAgent.includes('Chrome') && !acceptEncoding.includes('gzip')) {
    suspiciousCount++
    issues.push('chrome-without-gzip')
  }

  if (userAgent.includes('Mozilla') && !userAgent.includes('Gecko') && !userAgent.includes('WebKit')) {
    suspiciousCount++
    issues.push('invalid-mozilla-signature')
  }

  // Score based on number of issues
  if (suspiciousCount >= 3) {
    return { score: 35, reason: `header-inconsistency: ${issues.join(', ')}` }
  }

  if (suspiciousCount >= 2) {
    return { score: 20, reason: `header-issues: ${issues.join(', ')}` }
  }

  if (suspiciousCount >= 1) {
    return { score: 10, reason: `minor-header-issue: ${issues.join(', ')}` }
  }

  return { score: 0, reason: 'consistent-headers' }
}

/**
 * Browser fingerprinting analysis
 * Very complex, high chance of false positives
 */
export function analyzeBrowserFingerprint(
  headers: Record<string, any>,
  _sessionData: SessionData,
): { score: number, reason: string } {
  const userAgent = headers['user-agent'] || ''
  const acceptLanguage = headers['accept-language'] || ''

  // Calculate "fingerprint entropy"
  let entropy = 0
  const features = []

  // User agent entropy
  if (userAgent) {
    entropy += Math.log2(userAgent.length)
    features.push('user-agent')
  }

  // Language entropy
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').length
    entropy += Math.log2(languages + 1)
    features.push('languages')
  }

  // Client hints
  if (headers['sec-ch-ua']) {
    entropy += 2
    features.push('client-hints')
  }

  // DNT header
  if (headers.dnt) {
    entropy += 1
    features.push('dnt')
  }

  // Very low entropy suggests a bot
  if (entropy < 3 && features.length < 2) {
    return { score: 25, reason: `low-browser-entropy: ${entropy.toFixed(1)}` }
  }

  // Check for header order consistency (browsers typically send headers in specific orders)
  const headerOrder = Object.keys(headers)
  if (headerOrder.length > 5) {
    // This is complex and error-prone - simplified version
    const hasStandardOrder = headerOrder.includes('user-agent')
      && headerOrder.includes('accept')
    if (!hasStandardOrder) {
      return { score: 15, reason: 'unusual-header-order' }
    }
  }

  return { score: 0, reason: 'normal-browser-fingerprint' }
}
