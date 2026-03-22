export function extractRobotsMetaFromHtml(html: string) {
  // find the robots meta tag regardless of attribute order
  const metaTag = html.match(/<meta\s[^>]*\bname=["']robots["'][^>]*>/i)?.[0]
  if (!metaTag)
    return null
  const content = metaTag.match(/(?:^|\s)content=["']([^"']+)["']/i)?.[1] || null
  const productionContent = metaTag.match(/(?:^|\s)data-production-content=["']([^"']+)["']/i)?.[1] || null
  const hint = metaTag.match(/(?:^|\s)data-hint=["']([^"']+)["']/i)?.[1] || null
  return { content, productionContent, hint }
}
