import { defineEventHandler } from 'h3'
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

// @ts-expect-error alias module
import { serverQueryContent } from '#content/server'

export default defineEventHandler(async (e) => {
  const contentList = (await serverQueryContent(e).find()) as ParsedContent[]
  return contentList.map((c) => {
    if (c._draft || c._extension !== 'md' || c._partial)
      return false
    if (c.path) {
      if (String(c.robots) === 'false' || String(c.indexable) === 'false' || String(c.index) === 'false')
        return c.path
    }
    return false
  })
    .filter(Boolean)
})
