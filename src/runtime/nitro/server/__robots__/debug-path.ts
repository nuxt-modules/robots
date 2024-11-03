import { defineEventHandler, getQuery } from 'h3'
import { getPathRobotConfig } from '../../composables/getPathRobotConfig'

export default defineEventHandler(async (e) => {
  const path = getQuery(e).path as string
  return getPathRobotConfig(e, {
    path,
  })
})
