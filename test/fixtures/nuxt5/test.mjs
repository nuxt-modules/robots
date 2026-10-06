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
    const response = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(1_000),
    }).catch(() => null)
    if (response?.ok)
      return response
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Nuxt 5 server did not start')
}

try {
  const robots = await (await waitForServer()).text()
  assert.match(robots, /User-agent: \*/)
  const response = await fetch(origin, { headers: { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' } })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
  const html = await response.text()
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/)
  assert.match(html, /noindex, nofollow:true/)
  const context = await fetch(`${origin}/api/compat`).then(response => response.json())
  assert.deepEqual(context.normalisedRouteRule, { allow: false })
  assert.equal(context.routeRule.robots, false)
  assert.equal(context.robots.indexable, false)
  const debugPath = await fetch(`${origin}/__robots__/debug-path.json?path=/private`).then(response => response.json())
  assert.equal(debugPath.path, '/private')
  assert.equal(debugPath.indexable, false)
  const debug = await fetch(`${origin}/__robots__/debug.json`).then(response => response.json())
  assert.match(debug.robotsTxt, /User-agent: \*/)
}
finally {
  server.kill()
  if (server.exitCode === null)
    await once(server, 'exit')
}
