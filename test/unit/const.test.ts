import { describe, expect, it } from 'vitest'
import { AiBots } from '../../src/const'

describe('aiBots', () => {
  it('contains unique user-agent tokens', () => {
    const normalisedBots = AiBots.map(bot => bot.toLowerCase())

    expect(new Set(normalisedBots).size).toBe(AiBots.length)
  })

  it('uses current documented crawler tokens', () => {
    expect(AiBots).toEqual(expect.arrayContaining([
      'Amzn-SearchBot',
      'Google-GeminiNotebook',
      'MistralAI-Index',
      'omgili',
      'omgilibot',
    ]))
    expect(AiBots).not.toContain('Omigili')
    expect(AiBots).not.toContain('OmigiliBot')
    expect(AiBots).not.toContain('GoogleOther')
  })
})
