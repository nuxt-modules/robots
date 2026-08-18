import { dirname, resolve } from 'node:path'
import { defineCollection, defineContentConfig } from '@harlan-zw/comark-content'

const dirName = dirname(import.meta.url.replace('file://', ''))

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        cwd: resolve(dirName, 'content'),
      },
    }),
  },
})
