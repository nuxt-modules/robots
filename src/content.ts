import { z } from '@nuxt/content'

export function asRobotsCollection(collection: any) {
  if (collection.type !== 'page') {
    return
  }
  if (!collection.schema) {
    collection.schema = z.object({
      robots: z.union([z.string(), z.boolean()]).optional(),
    })
  }
  else {
    collection.schema = collection.schema.extend({
      robots: z.union([z.string(), z.boolean()]).optional(),
    })
  }
  collection._integrations = collection._integrations || []
  collection._integrations.push('robots')
  return collection
}
