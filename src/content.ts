import type { Collection } from '@nuxt/content'
import { z } from 'zod'

const robotsFieldSchema = z.union([z.string(), z.boolean()]).optional()

function withEditorHidden<T extends z.ZodTypeAny>(s: T): T {
  // .editor() is patched onto ZodType by @nuxt/content at runtime
  if (typeof (s as any).editor === 'function')
    return (s as any).editor({ hidden: true })
  return s
}

export interface DefineRobotsSchemaOptions {
  /**
   * Pass the `z` instance from `@nuxt/content` to ensure `.editor({ hidden: true })` works
   * across Zod versions. When omitted, the bundled `z` is used (`.editor()` applied if available).
   */
  z?: typeof z
}

/**
 * Define the robots schema field for a Nuxt Content collection.
 *
 * @example
 * defineCollection({
 *   type: 'page',
 *   source: '**',
 *   schema: z.object({
 *     robots: defineRobotsSchema()
 *   })
 * })
 */
export function defineRobotsSchema(options?: DefineRobotsSchemaOptions) {
  const _z = options?.z ?? z
  const s = _z.union([_z.string(), _z.boolean()]).optional()
  return withEditorHidden(s)
}

// Legacy schema export (wraps entire collection)
export const schema = z.object({
  robots: withEditorHidden(robotsFieldSchema),
})

/** @deprecated Use `defineRobotsSchema()` in your collection schema instead. See https://nuxtseo.com/robots/advanced/content */
export function asRobotsCollection<T>(collection: Collection<T>): Collection<T> {
  console.warn('[robots] `asRobotsCollection()` is deprecated. Use `defineRobotsSchema()` in your collection schema instead. See https://nuxtseo.com/robots/advanced/content')
  if (collection.type === 'page') {
    // @ts-expect-error untyped
    collection.schema = collection.schema ? schema.extend(collection.schema.shape) : schema
  }
  return collection
}
