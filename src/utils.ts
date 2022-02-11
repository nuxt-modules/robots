import { RuleInterface, Rule } from './types'

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

  for (const rule of options) {
    const parsed = parseRule(rule)
    const keys = Object.keys(correspondences).filter(key => typeof parsed[key] !== 'undefined')

    for (const key of keys) {
      const parsedKey = parsed[key]

      let values: string | Function | (string | Function)[]
      values = typeof parsedKey === 'function' ? await parsedKey.call(this, req) : parsedKey
      values = (Array.isArray(values)) ? values : [values]

      for (const value of values) {
        rules.push({
          key: correspondences[key],
          value: typeof value === 'function' ? await value.call(this, req) : value
        })
      }
    }
  }

  return rules
}

function parseRule (item: Rule) {
  const parsed: Rule = {}

  for (const [key, value] of Object.entries(item)) {
    parsed[String(key).toLowerCase().replace(/[\W_]+/g, '')] = value
  }

  return parsed
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
