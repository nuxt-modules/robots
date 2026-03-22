import { defineCollection, defineContentConfig } from '@nuxt/content'
import { defineRobotsSchema } from '../../../src/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        date: z.string().optional(),
        robots: defineRobotsSchema(),
      }),
    }),
  },
})
