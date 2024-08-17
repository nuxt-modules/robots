import { describe, expect, it } from 'vitest'
import { matchPathToRule } from '../../src/runtime/util'

describe('robotsTxtTester', () => {
  it('testPath', async () => {
    const rules = [
      { pattern: '/*/hidden', allow: false },
      { pattern: '/users/*/hidden', allow: false },
      { pattern: '/?a=', allow: false },
      { pattern: '/visible?*a=', allow: false },
    ]
    expect(matchPathToRule('/about/hidden', rules)).toMatchInlineSnapshot(`
      {
        "allow": false,
        "pattern": "/*/hidden",
      }
    `)
    expect(matchPathToRule('/users/sara/hidden', rules)).toMatchInlineSnapshot(`
      {
        "allow": false,
        "pattern": "/users/*/hidden",
      }
    `)
    expect(matchPathToRule('/users/sydeny/megan/hidden', rules)).toMatchInlineSnapshot(`
      {
        "allow": false,
        "pattern": "/users/*/hidden",
      }
    `)
    expect(matchPathToRule('/?a=value', rules)).toMatchInlineSnapshot(`
      {
        "allow": false,
        "pattern": "/?a=",
      }
    `)
    expect(matchPathToRule('/visible?b=one&a=two', rules)).toMatchInlineSnapshot(`
      {
        "allow": false,
        "pattern": "/visible?*a=",
      }
    `)
  })
})
