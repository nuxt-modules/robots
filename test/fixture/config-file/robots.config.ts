import { NodeIncomingMessage } from 'h3'

export default [
  { UserAgent: () => ['Googlebot', () => 'Bingbot'] },
  { Comment: 'Comment here' },
  { BlankLine: true },
  { Disallow: '/admin' },
  { Sitemap: (req: NodeIncomingMessage) => `https://${req.headers.host}/sitemap.xml` }
]
