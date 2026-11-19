import * as v from 'valibot'

export function defineRobotsSchema() {
  return v.optional(v.union([v.string(), v.boolean()]))
}
