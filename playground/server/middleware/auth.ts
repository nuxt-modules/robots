import { createError, defineEventHandler, getCookie } from 'nuxt/server'

export default defineEventHandler((e) => {
  if (e.url.pathname.startsWith('/admin')) {
    const authCookie = getCookie(e, 'auth')
    if (!authCookie || authCookie !== 'logged-in') {
      throw createError({
        status: 403,
        statusText: 'Forbidden - Please login first',
      })
    }
  }
})
