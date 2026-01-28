import { createError, defineEventHandler, getCookie } from 'h3'

export default defineEventHandler((e) => {
  if (e.path.startsWith('/admin')) {
    const authCookie = getCookie(e, 'auth')
    if (!authCookie || authCookie !== 'logged-in') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden - Please login first',
      })
    }
  }
})
