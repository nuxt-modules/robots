import { getPathRobotConfig } from '#imports'
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (e) => {
  const path = getQuery(e).path as string
  return getPathRobotConfig(e, {
    path,
  })
})
