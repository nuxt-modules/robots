// In-memory storage adapter for bot detection (for testing/development)
import type { BotDetectionStorage, SessionData, IPData, SiteProfile } from '../types'

export class MemoryAdapter implements BotDetectionStorage {
  private sessions = new Map<string, SessionData>()
  private ips = new Map<string, IPData>()
  private siteProfile: SiteProfile | null = null
  private ttl: number

  constructor(options: { ttl?: number } = {}) {
    this.ttl = options.ttl || 24 * 60 * 60 * 1000 // 24 hours default
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = this.sessions.get(sessionId)
    
    if (!data) return null
    
    // Check TTL
    if (Date.now() - data.lastUpdated > this.ttl) {
      this.sessions.delete(sessionId)
      return null
    }
    
    return data
  }

  async setSession(sessionId: string, data: SessionData): Promise<void> {
    this.sessions.set(sessionId, data)
  }

  async getIP(ip: string): Promise<IPData | null> {
    const data = this.ips.get(ip)
    
    if (!data) return null
    
    // Check TTL
    if (Date.now() - data.lastUpdated > this.ttl) {
      this.ips.delete(ip)
      return null
    }
    
    return data
  }

  async setIP(ip: string, data: IPData): Promise<void> {
    this.ips.set(ip, data)
  }

  async getSiteProfile(): Promise<SiteProfile | null> {
    return this.siteProfile
  }

  async setSiteProfile(profile: SiteProfile): Promise<void> {
    this.siteProfile = profile
  }

  async cleanup(): Promise<void> {
    const now = Date.now()
    
    // Clean up expired sessions
    for (const [sessionId, data] of this.sessions.entries()) {
      if (now - data.lastUpdated > this.ttl) {
        this.sessions.delete(sessionId)
      }
    }
    
    // Clean up expired IP data
    for (const [ip, data] of this.ips.entries()) {
      if (now - data.lastUpdated > this.ttl) {
        this.ips.delete(ip)
      }
    }
  }

  // Development helpers
  getStats() {
    return {
      sessions: this.sessions.size,
      ips: this.ips.size,
      hasSiteProfile: !!this.siteProfile
    }
  }

  clear() {
    this.sessions.clear()
    this.ips.clear()
    this.siteProfile = null
  }
}