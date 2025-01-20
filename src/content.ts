import type { Collection } from '@nuxt/content'
import type { TypeOf, ZodRawShape } from 'zod'
import { z } from '@nuxt/content'

export const schema = z.object({
  robots: z.union([z.string(), z.boolean()]).optional(),
})

export type RobotSchema = TypeOf<typeof schema>

export function asRobotsCollection<T extends ZodRawShape>(collection: Collection<T>): Collection<T> {
  if (collection.type === 'page') {
    // @ts-expect-error untyped
    collection.schema = collection.schema ? schema.extend(collection.schema.shape) : schema
  }
  return collection
}
