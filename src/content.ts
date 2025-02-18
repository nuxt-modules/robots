import type { Collection } from '@nuxt/content'
import { z } from 'zod'

export const schema = z.object({
  robots: z.union([z.string(), z.boolean()]).optional(),
})

export function asRobotsCollection<T extends Collection<any>>(collection: T): T {
  if (collection.type === 'page') {
    collection.schema = collection.schema ? schema.extend(collection.schema.shape) : schema
  }
  return collection
}
