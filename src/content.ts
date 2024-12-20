import { z } from 'zod'

export function asRobotsCollection (collection: any) {
  // augment the schema
  collection.schema = collection.schema || z.object()
  collection.schema = collection.schema.extend({
    robots: z.boolean().optional()
  })
  collection._withNuxtRobots = true
  return collection
}
