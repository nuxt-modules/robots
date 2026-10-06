import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'

const portServer = createServer()
portServer.listen(0, '127.0.0.1')
await once(portServer, 'listening')
const port = portServer.address().port
portServer.close()
await once(portServer, 'close')

const mode = process.env.NUXT_ROBOTS_MODE || 'enabled'
const origin = `http://127.0.0.1:${port}`
const nitroManifest = JSON.parse(await readFile(new URL('.output/nitro.json', import.meta.url), 'utf8'))
assert.match(nitroManifest.versions.nitro, /^3\./)

const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  cwd: import.meta.dirname,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: 'inherit',
})

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Nuxt 5 server exited with code ${server.exitCode}`)
    const response = await fetch(`${origin}/api/compat`, {
      signal: AbortSignal.timeout(1_000),
    }).catch((error) => {
      // Connection failures are expected while the server starts.
      if (error instanceof TypeError || error.name === 'TimeoutError')
        return null
      throw error
    })
    if (response?.ok)
      return response
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Nuxt 5 server did not start')
}

try {
  await waitForServer()
  const headers = { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
  const response = await fetch(origin, { headers })
  assert.equal(response.status, 200)
  const html = await response.text()
  const context = await fetch(`${origin}/api/compat`, { headers }).then(response => response.json())
  assert.equal(context.detectedBot, mode === 'enabled')
  assert.match(html, mode === 'enabled' ? /:deep:true/ : /:deep:false/)
  assert.equal(context.deepRobots.indexable, mode === 'disabled')
  if (mode === 'disabled') {
    assert.equal(response.headers.get('x-robots-tag'), null)
    assert.doesNotMatch(html, /<meta name="robots"/)
    assert.match(html, /:false/)
    assert.equal(context.robots.indexable, true)
    assert.equal(context.robots.rule, '')
    const disabledRobots = await fetch(`${origin}/robots.txt`)
    assert.match(disabledRobots.headers.get('content-type') || '', /text\/html/)
    assert.doesNotMatch(await disabledRobots.text(), /User-agent:/)
  }
  else {
    assert.equal(context.trailingRule.indexable, false)
    assert.equal(context.trailingRule.debug.source, 'Route Rules')
    assert.equal(context.lateRule.indexable, false)
    assert.equal(context.lateRule.debug.source, 'Route Rules')
    const robots = await fetch(`${origin}/robots.txt`).then(response => response.text())
    assert.match(robots, /User-agent: \*/)
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/)
    assert.match(html, mode === 'enabled' ? /noindex, nofollow:true/ : /noindex, nofollow:false/)
    assert.deepEqual(context.normalisedRouteRule, { allow: false })
    assert.equal(context.routeRule.robots, false)
    assert.equal(context.robots.indexable, false)
    const debugPath = await fetch(`${origin}/__robots__/debug-path.json?path=/private`).then(response => response.json())
    assert.equal(debugPath.path, '/private')
    assert.equal(debugPath.indexable, false)
    const debug = await fetch(`${origin}/__robots__/debug.json`).then(response => response.json())
    assert.match(debug.robotsTxt, /User-agent: \*/)
  }
}
finally {
  server.kill()
  if (server.exitCode === null)
    await once(server, 'exit')
}
