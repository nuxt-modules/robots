import { defineHandler } from 'h3'
import { RuleInterface, RuleValue, Rule } from '../../types'
import robots from '#robots'

export default defineHandler(async ({ req, res }) => {
  res.setHeader('Content-Type', 'text/plain')
  res.end(render(await getRules(robots, req)))
})

function render (rules: RuleInterface[]) {
  return rules.map(rule => `${rule.key}: ${String(rule.value).trim()}`).join('\n')
}

async function getRules (options: Rule | Rule[], req = null) {
  const correspondences = {
    useragent: 'User-agent',
    crawldelay: 'Crawl-delay',
    disallow: 'Disallow',
    allow: 'Allow',
    host: 'Host',
    sitemap: 'Sitemap',
    cleanparam: 'Clean-param'
  }

  const rules: RuleInterface[] = []

  const parseRule = (rule: Rule) => {
    const parsed: Rule = {}

    for (const [key, value] of Object.entries(rule)) {
      parsed[String(key).toLowerCase().replace(/[\W_]+/g, '')] = value
    }

    return parsed
  }

  for (const rule of Array.isArray(options) ? options : [options]) {
    const parsed = parseRule(rule)
    const keys = Object.keys(correspondences).filter(key => typeof parsed[key] !== 'undefined')

    for (const key of keys) {
      const parsedKey = parsed[key]

      let values: RuleValue
      values = typeof parsedKey === 'function' ? await parsedKey.call(req) : parsedKey
      values = (Array.isArray(values)) ? values : [values]

      for (const value of values) {
        const v = typeof value === 'function' ? await value(req) : value

        if (v === false) {
          continue
        }

        rules.push({
          key: correspondences[key],
          value: v
        })
      }
    }
  }

  return rules
}
