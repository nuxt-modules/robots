// @ts-expect-error v3 installed
import type { ParsedContent } from '@nuxt/content'
// @ts-expect-error alias module
import { serverQueryContent } from '#content/server'
import { defineEventHandler } from 'h3'
import { logger } from '../../logger'

export default defineEventHandler(async (e) => {
  const content: ParsedContent[] = []
  try {
    content.push(...(await serverQueryContent(e).find()) as ParsedContent[])
  }
  catch (e) {
    logger.error('Error querying Nuxt content', e)
  }
  return content.map((c) => {
    if (c._draft || c._extension !== 'md' || c._partial)
      return false
    if (c.path) {
      if (String(c.robots) === 'false')
        return c.path
    }
    return false
  })
    .filter(Boolean)
})
