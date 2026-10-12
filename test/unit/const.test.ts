import { describe, expect, it } from 'vitest'
import { AiBots, AiTrainingBots } from '../../src/const'

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

describe('aiTrainingBots', () => {
  it('is a subset of AiBots, so `true` blocks everything `training` blocks', () => {
    expect(AiBots).toEqual(expect.arrayContaining(AiTrainingBots))
  })

  it('includes the documented training crawlers', () => {
    expect(AiTrainingBots).toEqual(expect.arrayContaining(['Amazonbot', 'MistralAI-Training']))
  })

  it('leaves dedicated search and user-directed agents out', () => {
    for (const bot of ['Amzn-SearchBot', 'Amzn-User', 'MistralAI-Index', 'MistralAI-User'])
      expect(AiTrainingBots).not.toContain(bot)
  })
})
