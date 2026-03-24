import type { Collection } from '@nuxt/content'
import { createContentSchemaFactory } from 'nuxtseo-shared/content'
import { z } from 'zod'

const { defineSchema, asCollection, schema } = createContentSchemaFactory({
  fieldName: 'robots',
  label: 'robots',
  docsUrl: 'https://nuxtseo.com/robots/guides/content',
  buildSchema: _z => _z.union([_z.string(), _z.boolean()]).optional(),
}, z)

export { defineSchema as defineRobotsSchema, schema }

/** @deprecated Use `defineRobotsSchema()` in your collection schema instead. See https://nuxtseo.com/robots/advanced/content */
export function asRobotsCollection<T>(collection: Collection<T>): Collection<T> {
  return asCollection(collection) as Collection<T>
}
