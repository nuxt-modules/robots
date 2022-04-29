import { RuleInterface, Rule, RuleValue } from './types'

export async function getRules (options: Rule[], req = null) {
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

  for (const rule of options) {
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

export function render (rules: RuleInterface[]) {
  return rules.map(rule => `${rule.key}: ${String(rule.value).trim()}`).join('\n')
}

export function parseFile (content: string) {
  const rules: Rule[] = []

  content.split('\n').forEach((item) => {
    const ar = item.split(':')

    if (ar[0]) {
      rules.push({
        [ar[0]]: ar[1]
      })
    }
  })

  return rules
}
