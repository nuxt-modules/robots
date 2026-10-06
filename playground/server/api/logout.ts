import { defineEventHandler, deleteCookie } from 'nuxt/server'

export default defineEventHandler((e) => {
  deleteCookie(e, 'auth')
  return { success: true }
})
