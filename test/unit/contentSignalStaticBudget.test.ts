import { describe, expect, it } from 'vitest'
import { assertContentSignalHeaderBudget, mergeContentSignalHeaders } from '../../src/content-signal-headers'

describe('content-Signal static header budget', () => {
  it('blocks a fallback that would overflow a valid 100-rule file', () => {
    const contents = Array.from({ length: 100 }, (_, index) => `/page-${index}\n  X-Page: ${index}\n`).join('\n')
    expect(() => mergeContentSignalHeaders(contents, '/*', 'ai-train=no')).toThrow('Content-Signal fallback exceeds Cloudflare')
  })

  it('permits a later compiler to remove optional rules while retaining the policy', () => {
    const contents = Array.from({ length: 100 }, (_, index) => `/page-${index}\n  X-Page: ${index}\n`).join('\n')
    const generated = mergeContentSignalHeaders(contents, '/*', 'ai-train=no', null)
    const reduced = generated.replace('/page-99\n  X-Page: 99\n', '')
    expect(() => assertContentSignalHeaderBudget(reduced)).not.toThrow()
  })
})
