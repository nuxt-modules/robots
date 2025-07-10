// Path-based bot detection behavior
import type { H3Event } from 'h3'
import type { ImprovedDetectionContext, SiteProfile } from '../improved-behavior'
import { getResponseStatus } from 'h3'

/**
 * Simple path-based detection - checks for sensitive paths
 * Low complexity, high reliability
 */
export function analyzePathAccess(
  path: string,
  _context: ImprovedDetectionContext,
): { score: number, reason: string } {
  // Very high confidence malicious patterns
  const highRiskPatterns = [
    /wp-config\.php/,
    /\.env$/,
    /phpmyadmin/,
    /admin\.php/,
    /wp-login\.php/,
  ]

  const mediumRiskPatterns = [
    /\/admin$/,
    /\/login$/,
    /\/dashboard$/,
    /\/config$/,
  ]

  // Check for high-risk patterns
  for (const pattern of highRiskPatterns) {
    if (pattern.test(path)) {
      return { score: 40, reason: `high-risk-path: ${path}` }
    }
  }

  // Check for medium-risk patterns
  for (const pattern of mediumRiskPatterns) {
    if (pattern.test(path)) {
      return { score: 15, reason: `medium-risk-path: ${path}` }
    }
  }

  return { score: 0, reason: 'normal-path' }
}

/**
 * Build basic site profile by tracking successful responses
 * Simple and reliable
 */
export function buildBasicSiteProfile(event: H3Event, existingProfile?: SiteProfile): SiteProfile {
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

  // Only track successful responses
  if (status >= 200 && status < 300) {
    profile.existingPaths.add(path)

    // Simple CMS detection
    if (path.includes('/wp-') || path.includes('wp-admin')) {
      profile.detectedCMS = 'wordpress'
    }
    else if (path.includes('/_nuxt/')) {
      profile.detectedCMS = 'nuxt'
    }
  }

  return profile
}
