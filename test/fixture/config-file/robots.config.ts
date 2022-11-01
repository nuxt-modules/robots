import { IncomingMessage } from 'node:http'

export default [
  { UserAgent: () => ['Googlebot', () => 'Bingbot'] },
  { Comment: 'Comment here' },
  { BlankLine: true },
  { Disallow: '/admin' },
  { Sitemap: (req: IncomingMessage) => `https://${req.headers.host}/sitemap.xml` }
]
