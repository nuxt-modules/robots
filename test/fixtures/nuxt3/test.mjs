import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'

const portServer = createServer()
portServer.listen(0, '127.0.0.1')
await once(portServer, 'listening')
const port = portServer.address().port
portServer.close()
await once(portServer, 'close')
const origin = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  cwd: import.meta.dirname,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'inherit'],
})

try {
  await Promise.race([
    new Promise((resolve) => {
      server.stdout.on('data', (chunk) => {
        if (chunk.toString().includes('Listening on'))
          resolve()
      })
    }),
    once(server, 'exit').then(([code]) => { throw new Error(`Server exited with code ${code}`) }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Server did not start')), 30_000).unref()
    }),
  ])
  const response = await fetch(origin, { headers: { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' } })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
  const html = await response.text()
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/)
  assert.match(html, /noindex, nofollow:true/)
  const robots = await fetch(`${origin}/robots.txt`).then(response => response.text())
  assert.match(robots, /User-agent: \*/)
}
finally {
  server.kill()
  if (server.exitCode === null)
    await once(server, 'exit')
}
