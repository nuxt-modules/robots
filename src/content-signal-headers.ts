const STATIC_HEADER_RULE_BOUNDARY = /(?=^[^\s#])/m

export function pickContentSignalHeaderRules(contents: string): string {
  const rules: string[] = []
  for (const block of contents.split(STATIC_HEADER_RULE_BOUNDARY)) {
    if (!/^[^\s#]/.test(block))
      continue
    const [path, ...lines] = block.split(/\r?\n/)
    const directives = lines.filter(line => /^\s+(?:content-signal\s*:|!\s*content-signal\s*$)/i.test(line))
    if (directives.length)
      rules.push([path, ...directives].join('\n'))
  }
  return rules.join('\n\n')
}

/** Add a fallback without changing authored rule order or combining it with explicit policies. */
export function mergeContentSignalHeaders(contents: string, pattern: string, policy: string, limit: number | null = 100): string {
  const blocks = contents.split(STATIC_HEADER_RULE_BOUNDARY)
  const pathOf = (block: string) => block.split(/\r?\n/, 1)[0]!
  const setsPolicy = (block: string) => /^\s+content-signal\s*:/im.test(block)
  const removesPolicy = (block: string) => /^\s+!\s*content-signal\s*$/im.test(block)
  const fail = (advice = 'Set Content-Signal explicitly in the catch-all rule.'): never => {
    throw new Error(`Content-Signal fallback cannot preserve these ordered header rules. ${advice}`)
  }
  // Importing nested files must not replace any active root rule in Cloudflare's path map.
  // Check every directive before the catch-all shortcut, including unrelated security headers.
  const paths = new Set<string>()
  for (const block of blocks) {
    const path = pathOf(block).trim()
    if (!path || path.startsWith('#'))
      continue
    if (paths.has(path))
      fail('Combine duplicate paths in one rule.')
    paths.add(path)
  }
  // A site's own catch-all policy or removal is authoritative.
  if (blocks.some(block => pathOf(block) === pattern && (setsPolicy(block) || removesPolicy(block))))
    return contents

  // Only reason about literal paths and one trailing splat. Other patterns may overlap.
  const includes = (outer: string, inner: string) => outer === inner
    || (outer.endsWith('/*') && inner.startsWith(outer.slice(0, -1)))
  const simple = (path: string) => path.startsWith('/') && !path.startsWith('//') && !/[:?#\\\s]/.test(path)
    && (!path.includes('*') || (path.endsWith('/*') && !path.slice(0, -1).includes('*')))
    && new URL(path, 'https://example.com').pathname === path
  const disjoint = (left: string, right: string) => simple(left) && simple(right)
    && !includes(left, right) && !includes(right, left)
  const prior: string[] = []
  let fallbackAdded = false
  const hasBroad = blocks.some(block => pathOf(block) === pattern)
  const fallback = `${pattern}\n  Content-Signal: ${policy}\n\n`
  if (!hasBroad)
    fallbackAdded = true
  const merged = (hasBroad ? '' : fallback) + blocks.map((block) => {
    const path = pathOf(block)
    if (path === pattern) {
      fallbackAdded = true
      return block.replace(/^([^\r\n]*)(?:\r?\n|$)/, `$1\n  Content-Signal: ${policy}\n`)
    }
    if (!setsPolicy(block) && !removesPolicy(block))
      return block
    // A later fallback would append permissions to an already authoritative policy.
    // Moving that catch-all could change unrelated security headers.
    if (!fallbackAdded && !disjoint(pattern, path))
      fail()
    if (!setsPolicy(block) || removesPolicy(block)) {
      prior.push(path)
      return block
    }
    const covered = prior.some(previous => simple(previous) && simple(path) && includes(previous, path))
    if (!covered && !disjoint(pattern, path)) {
      // Reset once per disjoint region. Nested policies retain earlier explicit permissions.
      // A partial overlap needs conditional resets, which _headers cannot express safely here.
      if (!simple(path) || prior.some(previous => !disjoint(previous, path)))
        fail()
      block = block.replace(/^(\s+)(content-signal\s*:)/im, '$1! Content-Signal\n$1$2')
    }
    prior.push(path)
    return block
  }).join('')
  if (limit !== null)
    assertContentSignalHeaderBudget(merged, limit)
  return merged
}

export function countStaticHeaderRules(contents: string): number {
  return contents.split(/\r?\n/).filter(line => /^[^\s#]/.test(line)).length
}

/** Policy rules cannot be dropped to make a deployment fit. */
export function assertContentSignalHeaderBudget(contents: string, limit = 100): void {
  const total = countStaticHeaderRules(contents)
  if (total > limit)
    throw new Error(`Content-Signal fallback exceeds Cloudflare's ${limit}-rule header limit (${total}). Use a shared header rule or reduce other rules.`)
}
