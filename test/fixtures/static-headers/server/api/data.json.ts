import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return { records: [1, 2, 3] }
})
