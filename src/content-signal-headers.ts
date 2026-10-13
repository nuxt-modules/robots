/** Add the fallback first, so explicit Cloudflare rules can detach it before setting their policy. */
export function mergeContentSignalHeaders(contents: string, pattern: string, policy: string): string {
  const blocks = contents.split(/(?=^[^\s#])/m)
  // A site's own catch-all policy or removal is authoritative.
  const isBroad = (block: string) => block.split(/\r?\n/, 1)[0] === pattern
  const broad = blocks.filter(isBroad)
  if (broad.some(block => /^\s+(?:content-signal\s*:|!\s*content-signal\s*$)/im.test(block)))
    return contents
  const explicit = blocks.filter(block => !isBroad(block)).map((block) => {
    if (!/^\s+content-signal\s*:/im.test(block) || /^\s+!\s*content-signal\s*$/im.test(block))
      return block
    return block.replace(/^(\s+)(content-signal\s*:)/im, '$1! Content-Signal\n$1$2')
  }).join('')
  const fallback = broad.length
    ? broad.map(block => `${block.replace(/^([^\r\n]*)(?:\r?\n|$)/, `$1\n  Content-Signal: ${policy}\n`).trimEnd()}\n\n`).join('')
    : `${pattern}\n  Content-Signal: ${policy}\n\n`
  return `${fallback}${explicit}`
}
