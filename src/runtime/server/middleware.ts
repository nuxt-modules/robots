import { defineHandler } from 'h3'
import { getRules, render } from './utils'
import config from '#robots-config'

export default defineHandler(async ({ req, res }) => {
  res.setHeader('Content-Type', 'text/plain')
  res.end(render(await getRules(config, req)))
})
