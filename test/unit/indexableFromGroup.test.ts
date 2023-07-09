import { describe, expect, it } from 'vitest'
import { indexableFromGroup } from '../../src/runtime/util'

describe('indexableFromGroup', () => {
  it('basic', async () => {
    expect(
      indexableFromGroup([
        {
          userAgent: ['*'],
          disallow: [''],
          allow: [],
        },
      ], '/blog/vue-use-head-v1'),
    ).toBeTruthy()
  })
  it('randoms', async () => {
    expect(
      indexableFromGroup([
        {
          userAgent: ['*'],
          disallow: ['/blog'],
          allow: [],
        },
      ], '/blog/vue-use-head-v1'),
    ).toBeFalsy()
    expect(
      indexableFromGroup([
        {
          userAgent: ['*'],
          disallow: ['/blog'],
          allow: ['/blog/vue-use-head-v1'],
        },
      ], '/blog/vue-use-head-v1'),
    ).toBeTruthy()
  })
})
