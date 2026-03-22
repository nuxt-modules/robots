import { resolve, dirname } from 'node:path'
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { defineRobotsSchema } from '../../../src/content'
import { z } from 'zod'

const dirName = dirname(import.meta.url.replace('file://', ''))

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: {
        include: '**/*',
        cwd: resolve(dirName, 'content'),
      },
      schema: z.object({
        date: z.string().optional(),
        robots: defineRobotsSchema(),
      }),
    }),
  },
})
