export type Arrayable<T> = T | T[]

export interface ParsedRobotsTxt {
  groups: RobotsGroupResolved[]
  sitemaps: string[]
}

export interface RobotsGroupInput {
  comment?: Arrayable<string>
  disallow?: Arrayable<string>
  allow?: Arrayable<string>
  userAgent?: Arrayable<string>
}

export interface RobotsGroupResolved {
  comment: string[]
  disallow: string[]
  allow: string[]
  userAgent: string[]
  host?: string
}

export interface HookRobotsTxtContext {
  robotsTxt: string
}

export interface HookRobotsConfigContext extends ParsedRobotsTxt {
  context: 'robots.txt' | 'middleware'
}
