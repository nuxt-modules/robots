import { describe, expect, it } from 'vitest'

describe('mock composables', () => {
  it('app mocks should export correctly', async () => {
    const mocks = await import('../../src/runtime/app/composables/mock')

    expect(mocks.useRobotsRule).toBeDefined()
    expect(mocks.useBotDetection).toBeDefined()

    // Test that they return expected mock values
    const robotRule = mocks.useRobotsRule()
    expect(robotRule.value).toBe('')

    const botDetection = mocks.useBotDetection()
    expect(botDetection.isBot.value).toBe(false)
    expect(botDetection.botName.value).toBeUndefined()
  })

  it('server mocks should export correctly', async () => {
    const mocks = await import('../../src/runtime/server/mock-composables')

    expect(mocks.getPathRobotConfig).toBeDefined()
    expect(mocks.getSiteRobotConfig).toBeDefined()
    expect(mocks.getBotDetection).toBeDefined()
    expect(mocks.isBot).toBeDefined()
    expect(mocks.getBotInfo).toBeDefined()

    // Test that they return expected mock values
    const pathConfig = mocks.getPathRobotConfig({} as any)
    expect(pathConfig).toEqual({ indexable: true, rule: '' })

    const siteConfig = mocks.getSiteRobotConfig({} as any)
    expect(siteConfig).toEqual({ indexable: true, hints: [] })

    const botDetection = mocks.getBotDetection({} as any)
    expect(botDetection).toEqual({ isBot: false })

    const isBotResult = mocks.isBot({} as any)
    expect(isBotResult).toBe(false)

    const botInfo = mocks.getBotInfo({} as any)
    expect(botInfo).toBeNull()
  })
})
