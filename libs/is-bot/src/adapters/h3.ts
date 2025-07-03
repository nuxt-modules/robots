// H3/Nuxt adapters for bot detection
import type { H3Event } from 'h3'
import { getHeaders, getRequestIP, getResponseStatus, useSession } from 'h3'
import type { 
  BotDetectionRequest, 
  SessionIdentifier, 
  ResponseStatusProvider 
} from '../types'

/**
 * Convert H3Event to BotDetectionRequest
 */
export function h3ToBotDetectionRequest(event: H3Event): BotDetectionRequest {
  const headers = getHeaders(event)
  const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
  
  return {
    path: event.path || '/',
    method: event.method || 'GET',
    headers: headers as Record<string, string>,
    ip,
    timestamp: Date.now()
  }
}

/**
 * H3 Session Identifier using useSession
 */
export class H3SessionIdentifier implements SessionIdentifier {
  private sessionPassword: string

  constructor(sessionPassword?: string) {
    this.sessionPassword = sessionPassword || 'default-bot-detection-password'
  }

  async getSessionId(request: BotDetectionRequest): Promise<string> {
    // This is a simplified version - in practice you'd need to pass the H3Event
    // For now, we'll generate a session ID based on IP and user agent
    const userAgent = Array.isArray(request.headers['user-agent']) 
      ? request.headers['user-agent'][0] 
      : request.headers['user-agent'] || ''
    
    // Simple hash for demo - in practice use proper session handling
    const sessionKey = `${request.ip}-${this.simpleHash(userAgent)}`
    return sessionKey
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

/**
 * H3 Session Identifier using actual H3 sessions
 */
export class H3RealSessionIdentifier implements SessionIdentifier {
  private sessionPassword: string

  constructor(sessionPassword?: string) {
    this.sessionPassword = sessionPassword || 'default-bot-detection-password'
  }

  // Note: This requires the actual H3Event, so you'd need to modify the interface
  async getSessionIdFromEvent(event: H3Event): Promise<string> {
    const session = await useSession(event, {
      password: this.sessionPassword
    })
    return session.id
  }

  // Fallback implementation for the interface
  getSessionId(request: BotDetectionRequest): string {
    // Generate deterministic session ID from request data
    const userAgent = Array.isArray(request.headers['user-agent']) 
      ? request.headers['user-agent'][0] 
      : request.headers['user-agent'] || ''
    
    return `${request.ip}-${this.simpleHash(userAgent)}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }
}

/**
 * H3 Response Status Provider
 */
export class H3ResponseStatusProvider implements ResponseStatusProvider {
  private eventMap = new WeakMap<BotDetectionRequest, H3Event>()

  // Register the H3Event for a request so we can get status later
  registerEvent(request: BotDetectionRequest, event: H3Event) {
    this.eventMap.set(request, event)
  }

  getStatus(request: BotDetectionRequest): number | undefined {
    const event = this.eventMap.get(request)
    if (!event) return undefined
    
    try {
      return getResponseStatus(event)
    } catch {
      return undefined
    }
  }
}

/**
 * Utility to create a BotDetectionRequest that maintains reference to H3Event
 */
export function createTrackedBotDetectionRequest(
  event: H3Event, 
  statusProvider: H3ResponseStatusProvider
): BotDetectionRequest {
  const request = h3ToBotDetectionRequest(event)
  statusProvider.registerEvent(request, event)
  return request
}