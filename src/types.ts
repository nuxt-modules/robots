export enum Correspondence {
  'User-agent',
  'Crawl-delay',
  'Disallow',
  'Allow',
  'Host',
  'Sitemap',
  'Clean-param'
}

export interface RuleInterface {
  key: Correspondence
  value: string
}

export type RuleValue = string | boolean | Function | (string | boolean | Function)[]

export type Rule = {
  [key: string]: RuleValue
}
