import { describe, it, expect } from 'vitest'

describe('Library Setup', () => {
  it('should be able to import core components', async () => {
    const { BotDetectionEngine } = await import('../src/core')
    const { MemoryAdapter } = await import('../src/adapters/memory')
    const { H3SessionIdentifier } = await import('../src/adapters/h3')
    
    expect(BotDetectionEngine).toBeDefined()
    expect(MemoryAdapter).toBeDefined()
    expect(H3SessionIdentifier).toBeDefined()
  })

  it('should be able to import from index', async () => {
    const module = await import('../src/index')
    
    expect(module.BotDetectionEngine).toBeDefined()
    expect(module.MemoryAdapter).toBeDefined()
    expect(module.UnstorageAdapter).toBeDefined()
    expect(module.UnstorageBehaviorAdapter).toBeDefined()
    expect(module.H3SessionIdentifier).toBeDefined()
    expect(module.isBotUserAgent).toBeDefined()
    expect(module.isSensitivePath).toBeDefined()
    expect(module.isValidUserAgent).toBeDefined()
  })

  it('should export utility functions', async () => {
    const { isBotUserAgent, isSensitivePath, isValidUserAgent } = await import('../src/index')
    
    // Test utility functions
    expect(isBotUserAgent('curl/7.68.0')).toBe(true)
    expect(isBotUserAgent('Mozilla/5.0 (legitimate browser)')).toBe(false)
    
    expect(isSensitivePath('/wp-admin')).toBe(true)
    expect(isSensitivePath('/about')).toBe(false)
    
    expect(isValidUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')).toBe(true)
    expect(isValidUserAgent('curl')).toBe(false)
  })
})