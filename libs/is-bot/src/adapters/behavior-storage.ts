// Adapter to bridge between framework-agnostic storage and behavior types
import type { Storage } from 'unstorage'
import type { SessionData, IPData } from '../behavior'
import type { SiteProfile } from '../types'

export interface BehaviorStorage {
  getSession(sessionId: string): Promise<SessionData | null>
  setSession(sessionId: string, data: SessionData): Promise<void>
  getIP(ip: string): Promise<IPData | null>
  setIP(ip: string, data: IPData): Promise<void>
  getSiteProfile(): Promise<SiteProfile | null>
  setSiteProfile(profile: SiteProfile): Promise<void>
  cleanup?(): Promise<void>
}

export class UnstorageBehaviorAdapter implements BehaviorStorage {
  private storage: Storage
  private prefix: string
  private sessionTTL: number
  private ipTTL: number
  private siteProfileTTL: number

  constructor(storage: Storage, options: { 
    prefix?: string, 
    sessionTTL?: number,
    ipTTL?: number,
    siteProfileTTL?: number
  } = {}) {
    this.storage = storage
    this.prefix = options.prefix || 'bot-detection'
    this.sessionTTL = options.sessionTTL || 24 * 60 * 60 * 1000 // 24 hours default
    this.ipTTL = options.ipTTL || 7 * 24 * 60 * 60 * 1000 // 7 days default
    this.siteProfileTTL = options.siteProfileTTL || 30 * 24 * 60 * 60 * 1000 // 30 days default
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
    
    // Check TTL
    if (Date.now() - data.lastUpdated > this.ipTTL) {
      await this.storage.removeItem(key)
      return null
    }
    
    return data
  }

  async setIP(ip: string, data: IPData): Promise<void> {
    const key = `${this.prefix}:ip:${this.sanitizeIP(ip)}`
    await this.storage.setItem(key, data)
  }

  async getSiteProfile(): Promise<SiteProfile | null> {
    const key = `${this.prefix}:site-profile`
    return await this.storage.getItem<SiteProfile>(key)
  }

  async setSiteProfile(profile: SiteProfile): Promise<void> {
    const key = `${this.prefix}:site-profile`
    await this.storage.setItem(key, profile)
  }

  async cleanup(): Promise<void> {
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