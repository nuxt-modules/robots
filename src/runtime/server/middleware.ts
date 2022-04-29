import { defineHandler } from 'h3'
import { options, getRules, render } from '#robots-options'

export default defineHandler(async ({ req, res }) => {
  const rules = await getRules(options, req)

  res.setHeader('Content-Type', 'text/plain')
  res.end(render(rules))
})
