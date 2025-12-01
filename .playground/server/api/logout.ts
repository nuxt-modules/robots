import { defineEventHandler, deleteCookie } from 'h3'

export default defineEventHandler((e) => {
  deleteCookie(e, 'auth')
  return { success: true }
})
