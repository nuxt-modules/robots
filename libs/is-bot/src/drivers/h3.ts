// H3 driver for bot detection
import type { H3Event } from 'h3'
import { getHeaders, getRequestIP, getResponseStatus, useSession } from 'h3'
import type { 
  BotDetectionDriver, 
  BotDetectionRequestData, 
  BotDetectionDriverOptions 
} from './types'

export class H3Driver implements BotDetectionDriver<H3Event> {
  private options: BotDetectionDriverOptions

  constructor(options: BotDetectionDriverOptions = {}) {
    this.options = {
      sessionConfig: {
        password: 'default-bot-detection-password',
        cookieName: 'nuxt-session',
        ...options.sessionConfig
      },
      ipExtraction: {
        trustProxy: true,
        proxyHeaders: ['x-forwarded-for', 'x-real-ip'],
        ...options.ipExtraction
      },
      debug: options.debug || false
    }
  }

  extractRequest(event: H3Event): BotDetectionRequestData {
    const headers = getHeaders(event)
    const ip = getRequestIP(event, { 
      xForwardedFor: this.options.ipExtraction?.trustProxy 
    }) || '127.0.0.1'
    
    const userAgent = this.getHeaderValue(headers, 'user-agent')
    const referer = this.getHeaderValue(headers, 'referer') || this.getHeaderValue(headers, 'referrer')
    const acceptLanguage = this.getHeaderValue(headers, 'accept-language')
    const acceptEncoding = this.getHeaderValue(headers, 'accept-encoding')

    return {
      path: event.path || '/',
      method: event.method || 'GET',
      headers,
      ip,
      timestamp: Date.now(),
      userAgent,
      referer,
      acceptLanguage,
      acceptEncoding
    }
  }

  async extractSessionId(event: H3Event): Promise<string> {
    try {
      const session = await useSession(event, {
        password: this.options.sessionConfig?.password || 'default-bot-detection-password'
      })
      return session.id
    } catch (error) {
      if (this.options.debug) {
        console.warn('Failed to get session, falling back to IP-based session:', error)
      }
      // Fallback to IP + User Agent hash
      return this.generateFallbackSessionId(event)
    }
  }

  extractResponseStatus(event: H3Event): number | undefined {
    try {
      return getResponseStatus(event)
    } catch {
      return undefined
    }
  }

  isTrustedIP(ip: string): boolean {
    // Common trusted IP ranges
    const trustedRanges = [
      '127.0.0.1',
      '::1',
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16'
    ]

    // Simple check for exact matches (in production, use proper CIDR matching)
    return trustedRanges.some(range => {
      if (range.includes('/')) {
        // Simplified CIDR check - in production use proper library
        const baseIP = range.split('/')[0]
        return ip.startsWith(baseIP.substring(0, baseIP.lastIndexOf('.')))
      }
      return ip === range
    })
  }

  getAdditionalContext(event: H3Event): Record<string, any> {
    const headers = getHeaders(event)
    
    return {
      protocol: headers['x-forwarded-proto'] || 'http',
      host: headers.host,
      connection: headers.connection,
      upgradeInsecureRequests: headers['upgrade-insecure-requests'],
      secFetchSite: headers['sec-fetch-site'],
      secFetchMode: headers['sec-fetch-mode'],
      secFetchUser: headers['sec-fetch-user'],
      secFetchDest: headers['sec-fetch-dest'],
      secChUa: headers['sec-ch-ua'],
      secChUaMobile: headers['sec-ch-ua-mobile'],
      secChUaPlatform: headers['sec-ch-ua-platform']
    }
  }

  private getHeaderValue(headers: Record<string, any>, name: string): string | undefined {
    const value = headers[name]
    if (Array.isArray(value)) {
      return value[0]
    }
    return value
  }

  private generateFallbackSessionId(event: H3Event): string {
    const headers = getHeaders(event)
    const ip = getRequestIP(event, { xForwardedFor: this.options.ipExtraction?.trustProxy }) || '127.0.0.1'
    const userAgent = this.getHeaderValue(headers, 'user-agent') || ''
    
    // Create a deterministic session ID from IP and User Agent
    return `fallback-${this.simpleHash(`${ip}-${userAgent}`)}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

// Convenience function for quick H3 integration
export function createH3BotDetection(options: BotDetectionDriverOptions = {}) {
  return new H3Driver(options)
}