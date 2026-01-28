import { defineEventHandler, setCookie } from 'h3'

export default defineEventHandler((e) => {
  setCookie(e, 'auth', 'logged-in', {
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  })
  return { success: true }
})
