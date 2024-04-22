import type { NodeIncomingMessage } from 'h3'
import { defineEventHandler, setHeader } from 'h3'
import type { RuleValue, Rule } from '../../types'
import robots from '#robots'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'text/plain')
  return render(await getRules(robots, event.req))
})

enum Correspondence {
  'User-agent',
  'Crawl-delay',
  'Disallow',
  'Disavow',
  'Allow',
  'Host',
  'Sitemap',
  'Clean-param',
  'Comment',
  'BlankLine',
}

interface RuleInterface {
  key: Correspondence
  value: string
}

function render(rules: RuleInterface[]) {
  return rules.map((rule) => {
    const value = String(rule.value).trim()

    switch (rule.key.toString()) {
      case Correspondence[Correspondence.Comment]:
        return `# ${value}`
      case Correspondence[Correspondence.BlankLine]:
        return ''
      default:
        return `${rule.key}: ${value}`
    }
  }).join('\n')
}

async function getRules(options: Rule | Rule[], req: NodeIncomingMessage) {
  const correspondences = {
    useragent: 'User-agent',
    crawldelay: 'Crawl-delay',
    disallow: 'Disallow',
    disavow: 'Disavow',
    allow: 'Allow',
    host: 'Host',
    sitemap: 'Sitemap',
    cleanparam: 'Clean-param',
    comment: 'Comment',
    blankline: 'BlankLine',
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
      values = typeof parsedKey === 'function' ? await parsedKey(req) : parsedKey
      values = (Array.isArray(values)) ? values : [values]

      for (const value of values) {
        const v = typeof value === 'function' ? await value(req) : value

        if (v === false) {
          continue
        }

        rules.push({
          key: correspondences[key],
          value: v,
        })
      }
    }
  }

  return rules
}
