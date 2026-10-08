import { defineEventHandler, getQuery } from 'nuxt/server'
import { getPathRobotConfig } from '#robots/server'

export default defineEventHandler(event => getPathRobotConfig(event, { path: String(getQuery(event).path) }))
