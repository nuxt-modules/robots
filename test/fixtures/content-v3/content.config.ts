import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'
import { asRobotsCollection } from '../../../src/content'

export default defineContentConfig({
  collections: {
    content: defineCollection(
      asRobotsCollection({
        type: 'page',
        source: '**/*.md',
        schema: z.object({
          date: z.string().optional(),
        }),
      }),
    ),
  },
})
