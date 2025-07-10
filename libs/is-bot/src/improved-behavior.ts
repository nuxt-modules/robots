// Improved bot detection with context-aware heuristics
import type { H3Event } from 'h3'
import { getHeaders, getResponseStatus } from 'h3'

// Smart path analysis that adapts to the actual site
export interface SiteProfile {
  detectedCMS?: 'wordpress' | 'drupal' | 'nuxt' | 'next' | 'unknown'
  hasAdminArea: boolean
  adminPaths: string[]
  apiEndpoints: string[]
  existingPaths: Set<string>
  userAgentPatterns: Map<string, number>
  legitimateAccessPatterns: string[]
}

// Context-aware scoring that considers intent
export interface ImprovedDetectionContext {
  userIntent: 'browsing' | 'exploring' | 'scanning' | 'exploiting' | 'unknown'
  accessPattern: 'human-like' | 'systematic' | 'random' | 'malicious'
  credibilityScore: number // 0-100, builds over time
  authenticationStatus: 'authenticated' | 'anonymous' | 'unknown'
  referrerContext: 'internal' | 'search-engine' | 'direct' | 'suspicious'
  technicalProfile: {
    browserFeatures: string[]
    networkConsistency: number
    headerCredibility: number
  }
}

// Improved scoring that rewards good behavior
export const IMPROVED_BEHAVIOR_WEIGHTS = {
  // Positive factors (reduce bot score)
  GOOD_NAVIGATION: -10, // Following logical navigation paths
  CONTENT_ENGAGEMENT: -15, // Time spent reading content
  LEGITIMATE_REFERRER: -5, // Coming from search engines/legitimate sites
  PROPER_HEADERS: -8, // Complete, consistent header set
  AUTHENTICATED_ACCESS: -20, // Successfully authenticated users

  // Negative factors (increase bot score)
  NONEXISTENT_PATH_SCAN: 25, // Scanning for paths that don't exist
  CREDENTIAL_STUFFING: 50, // Multiple login attempts
  VULNERABILITY_PROBE: 40, // Testing for known vulnerabilities
  RAPID_ERROR_GENERATION: 30, // Generating many errors quickly
  SUSPICIOUS_USER_AGENT: 20, // User agent inconsistencies

  // Context-dependent factors
  ADMIN_ACCESS_UNAUTHENTICATED: 35, // Accessing admin without auth
  API_ABUSE: 25, // Excessive API calls without proper usage
  SYSTEMATIC_ENUMERATION: 30, // Clear enumeration patterns
}

// Intent recognition based on request patterns
export function analyzeUserIntent(requests: Array<{ path: string, timestamp: number, status?: number }>): string {
  if (requests.length < 3)
    return 'unknown'

  const paths = requests.map(r => r.path)
  const recentPaths = paths.slice(-10) // Last 10 requests

  // Check for logical navigation patterns
  const hasLogicalProgression = checkLogicalProgression(recentPaths)
  if (hasLogicalProgression)
    return 'browsing'

  // Check for systematic scanning
  const isSystematic = checkSystematicPattern(recentPaths)
  if (isSystematic)
    return 'scanning'

  // Check for exploitation attempts
  const isExploiting = checkExploitationPattern(recentPaths)
  if (isExploiting)
    return 'exploiting'

  // Check for curious exploration (legitimate)
  const isExploring = checkExplorationPattern(recentPaths)
  if (isExploring)
    return 'exploring'

  return 'unknown'
}

function checkLogicalProgression(paths: string[]): boolean {
  // Look for human-like navigation:
  // - Home -> category -> article
  // - Search -> results -> details
  // - Navigation menu following

  const navigationPatterns = [
    ['/', '/blog', '/blog/'], // Home to blog
    ['/', '/products', '/products/'], // Home to products
    ['/search', '/article/', '/'], // Search to content
  ]

  return navigationPatterns.some(pattern =>
    pattern.every((step, i) => i >= paths.length || paths[i].includes(step)),
  )
}

function checkSystematicPattern(paths: string[]): boolean {
  // Detect systematic scanning (high confidence bot behavior):
  // - Sequential numeric IDs: /user/1, /user/2, /user/3
  // - Alphabetical enumeration: /admin, /backup, /config
  // - Extension testing: /index.php, /index.asp, /index.html

  // Check for numeric sequence scanning
  const numericMatches = paths
    .map(p => p.match(/\/(\d+)(?:\/|$)/))
    .filter(Boolean)
    .map(m => Number.parseInt(m![1]))

  if (numericMatches.length >= 3) {
    const sorted = [...numericMatches].sort((a, b) => a - b)
    const isSequential = sorted.every((val, i) => i === 0 || val === sorted[i - 1] + 1)
    if (isSequential)
      return true
  }

  // Check for alphabetical scanning
  const pathBases = paths.map(p => p.split('/').pop()?.split('?')[0]).filter(Boolean)
  if (pathBases.length >= 4) {
    const sorted = [...pathBases].sort()
    const isAlphabetical = pathBases.join('') === sorted.join('')
    if (isAlphabetical)
      return true
  }

  return false
}

function checkExploitationPattern(paths: string[]): boolean {
  // High-confidence malicious patterns:
  // - SQL injection attempts
  // - XSS probe attempts
  // - Directory traversal
  // - Known vulnerability scanners

  const exploitPatterns = [
    /['"]\s*(union|select|insert|update|delete)/i, // SQL injection
    /<script|javascript:|onload=/i, // XSS attempts
    /\.\.[/\\]/, // Directory traversal
    /(\.\.%2f|\.\.%5c)/i, // Encoded traversal
    /\.(git|svn|env|config|bak)$/i, // Sensitive file access
  ]

  return paths.some(path =>
    exploitPatterns.some(pattern => pattern.test(path)),
  )
}

function checkExplorationPattern(paths: string[]): boolean {
  // Legitimate user exploration:
  // - Checking multiple sections of site
  // - Following links and references
  // - Reasonable time between requests
  // - Mixture of successful and failed requests (normal 404s)

  const uniqueSections = new Set(
    paths.map(p => `/${p.split('/')[1]}`).filter(Boolean),
  )

  // Exploring multiple sections is human-like
  return uniqueSections.size >= 3 && paths.length >= 5
}

// Site profiling to understand what's legitimate for THIS site
export function buildSiteProfile(event: H3Event, existingProfile?: SiteProfile): SiteProfile {
  const profile = existingProfile || {
    detectedCMS: 'unknown',
    hasAdminArea: false,
    adminPaths: [],
    apiEndpoints: [],
    existingPaths: new Set(),
    userAgentPatterns: new Map(),
    legitimateAccessPatterns: [],
  }

  const path = event.path || ''
  const status = getResponseStatus(event)
  const headers = getHeaders(event)
  const userAgent = headers['user-agent'] || ''

  // Track existing paths (200 responses)
  if (status >= 200 && status < 300) {
    profile.existingPaths.add(path)

    // Detect CMS type based on successful responses
    if (path.includes('/wp-') || path.includes('wp-admin')) {
      profile.detectedCMS = 'wordpress'
    }
    else if (path.includes('/_nuxt/')) {
      profile.detectedCMS = 'nuxt'
    }
    else if (path.includes('/_next/')) {
      profile.detectedCMS = 'next'
    }

    // Detect admin areas
    if (path.includes('/admin') || path.includes('/dashboard')) {
      profile.hasAdminArea = true
      profile.adminPaths.push(path)
    }

    // Detect API endpoints
    if (path.includes('/api/') || path.includes('.json')) {
      profile.apiEndpoints.push(path)
    }
  }

  // Track legitimate user agent patterns
  if (userAgent && status < 400) {
    const count = profile.userAgentPatterns.get(userAgent) || 0
    profile.userAgentPatterns.set(userAgent, count + 1)
  }

  return profile
}

// Context-aware path scoring
export function scorePathAccess(
  path: string,
  profile: SiteProfile,
  context: ImprovedDetectionContext,
): { score: number, reason: string } {
  // If path exists on site and user is exploring legitimately, minimal penalty
  if (profile.existingPaths.has(path) && context.userIntent === 'browsing') {
    return { score: 0, reason: 'legitimate-access' }
  }

  // If authenticated user accessing admin area, no penalty
  if (context.authenticationStatus === 'authenticated'
    && profile.adminPaths.some(ap => path.startsWith(ap))) {
    return { score: 0, reason: 'authenticated-admin-access' }
  }

  // High penalty for scanning non-existent paths
  if (!profile.existingPaths.has(path) && context.userIntent === 'scanning') {
    return { score: 40, reason: 'nonexistent-path-scanning' }
  }

  // Very high penalty for exploitation attempts
  if (context.userIntent === 'exploiting') {
    return { score: 60, reason: 'exploitation-attempt' }
  }

  // Moderate penalty for unauthenticated admin access
  if (context.authenticationStatus === 'anonymous'
    && profile.adminPaths.some(ap => path.startsWith(ap))) {
    return { score: 25, reason: 'unauthenticated-admin-attempt' }
  }

  // Check against CMS-specific patterns only if that CMS is detected
  if (profile.detectedCMS === 'wordpress' && isWordPressVulnerabilityPath(path)) {
    return { score: 35, reason: 'wordpress-vulnerability-probe' }
  }

  // Default: small penalty for accessing non-existent paths
  if (!profile.existingPaths.has(path)) {
    return { score: 10, reason: 'nonexistent-path' }
  }

  return { score: 0, reason: 'normal-access' }
}

function isWordPressVulnerabilityPath(path: string): boolean {
  const wpVulnPaths = [
    '/wp-config.php',
    '/wp-config.php.bak',
    '/wp-admin/install.php',
    '/.wp-config.php.swp',
  ]
  return wpVulnPaths.some(vp => path.includes(vp))
}

// Credibility scoring that builds trust over time
export function updateCredibilityScore(
  currentScore: number,
  sessionData: any,
  context: ImprovedDetectionContext,
): number {
  let newScore = currentScore

  // Positive actions that build credibility
  if (context.userIntent === 'browsing')
    newScore += 2
  if (context.accessPattern === 'human-like')
    newScore += 3
  if (context.authenticationStatus === 'authenticated')
    newScore += 5
  if (context.referrerContext === 'search-engine')
    newScore += 1

  // Negative actions that reduce credibility
  if (context.userIntent === 'scanning')
    newScore -= 10
  if (context.userIntent === 'exploiting')
    newScore -= 20
  if (context.accessPattern === 'malicious')
    newScore -= 15

  // Cap at 0-100
  return Math.max(0, Math.min(100, newScore))
}
