// Unstorage adapter for bot detection storage
import type { Storage } from 'unstorage'
import type { BotDetectionStorage, SessionData, IPData, SiteProfile } from '../types'

export class UnstorageAdapter implements BotDetectionStorage {
  private storage: Storage
  private prefix: string
  private sessionTTL: number
  private ipTTL: number
  private siteProfileTTL: number

  constructor(storage: Storage, options: { 
    prefix?: string, 
    ttl?: number,
    sessionTTL?: number,
    ipTTL?: number,
    siteProfileTTL?: number
  } = {}) {
    this.storage = storage
    this.prefix = options.prefix || 'bot-detection'
    this.sessionTTL = options.sessionTTL || options.ttl || 24 * 60 * 60 * 1000 // 24 hours default
    this.ipTTL = options.ipTTL || options.ttl || 7 * 24 * 60 * 60 * 1000 // 7 days default
    this.siteProfileTTL = options.siteProfileTTL || options.ttl || 30 * 24 * 60 * 60 * 1000 // 30 days default
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `${this.prefix}:session:${sessionId}`
    const data = await this.storage.getItem<SessionData>(key)
    
    if (!data) return null
    
    // Check TTL
    if (Date.now() - data.lastUpdated > this.sessionTTL) {
      await this.storage.removeItem(key)
      return null
    }
    
    return data
  }

  async setSession(sessionId: string, data: SessionData): Promise<void> {
    const key = `${this.prefix}:session:${sessionId}`
    await this.storage.setItem(key, data)
  }

  async getIP(ip: string): Promise<IPData | null> {
    const key = `${this.prefix}:ip:${this.sanitizeIP(ip)}`
    const data = await this.storage.getItem<IPData>(key)
    
    if (!data) return null
    
    // Check TTL and cleanup old sessions
    const now = Date.now()
    if (now - data.lastUpdated > this.ipTTL) {
      // Clean up old sessions
      data.activeSessions = data.activeSessions.filter(sessionId => {
        // This is a simplification - in practice you'd check session TTL
        return true
      })
      
      if (data.activeSessions.length === 0) {
        await this.storage.removeItem(key)
        return null
      }
    }
    
    return data
  }

  async setIP(ip: string, data: IPData): Promise<void> {
    const key = `${this.prefix}:ip:${this.sanitizeIP(ip)}`
    await this.storage.setItem(key, data)
  }

  async getSiteProfile(): Promise<SiteProfile | null> {
    const key = `${this.prefix}:site-profile`
    const data = await this.storage.getItem<SiteProfile>(key)
    
    if (!data) return null
    
    // Reconstruct Set and Map objects
    if (data.existingPaths && Array.isArray(data.existingPaths)) {
      data.existingPaths = new Set(data.existingPaths as any)
    }
    
    if (data.userAgentPatterns && typeof data.userAgentPatterns === 'object') {
      data.userAgentPatterns = new Map(Object.entries(data.userAgentPatterns as any))
    }
    
    return data
  }

  async setSiteProfile(profile: SiteProfile): Promise<void> {
    const key = `${this.prefix}:site-profile`
    
    // Serialize Set and Map objects for storage
    const serializable = {
      ...profile,
      existingPaths: Array.from(profile.existingPaths),
      userAgentPatterns: Object.fromEntries(profile.userAgentPatterns)
    }
    
    await this.storage.setItem(key, serializable)
  }

  async cleanup(): Promise<void> {
    // Get all keys with our prefix
    const keys = await this.storage.getKeys(`${this.prefix}:`)
    const now = Date.now()
    
    // Clean up expired sessions
    const sessionKeys = keys.filter(key => key.includes(':session:'))
    for (const key of sessionKeys) {
      const data = await this.storage.getItem<SessionData>(key)
      if (data && (now - data.lastUpdated > this.sessionTTL)) {
        await this.storage.removeItem(key)
      }
    }
    
    // Clean up expired IP data
    const ipKeys = keys.filter(key => key.includes(':ip:'))
    for (const key of ipKeys) {
      const data = await this.storage.getItem<IPData>(key)
      if (data && (now - data.lastUpdated > this.ipTTL)) {
        await this.storage.removeItem(key)
      }
    }
  }

  private sanitizeIP(ip: string): string {
    // Replace : and . with - for safe key names
    return ip.replace(/[:.]/g, '-')
  }
}