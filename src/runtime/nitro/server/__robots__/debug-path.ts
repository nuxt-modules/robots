import { defineEventHandler, getQuery } from 'h3'
import { getPathRobotConfig } from '#internal/nuxt-robots'

export default defineEventHandler(async (e) => {
  const path = getQuery(e).path as string
  return await getPathRobotConfig(e, {
    path,
  })
})
