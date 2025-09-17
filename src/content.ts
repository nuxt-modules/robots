import type { Collection } from '@nuxt/content'
import { z } from 'zod'

export const schema = z.object({
  robots: z.union([z.string(), z.boolean()]).optional(),
})

export function asRobotsCollection<T>(collection: Collection<T>): Collection<T> {
  if (collection.type === 'page') {
    // @ts-expect-error untyped
    collection.schema = collection.schema ? schema.extend(collection.schema.shape) : schema
  }
  return collection
}
