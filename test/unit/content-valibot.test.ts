import { safeParse } from 'valibot'
import { describe, expect, it } from 'vitest'
import { defineRobotsSchema } from '../../src/content-valibot'

describe('defineRobotsSchema', () => {
  it.each([undefined, false, 'index, nofollow'])('accepts %s', (value) => {
    expect(safeParse(defineRobotsSchema(), value)).toMatchObject({ success: true, output: value })
  })

  it('rejects a number', () => {
    expect(safeParse(defineRobotsSchema(), 1).success).toBe(false)
  })
})
