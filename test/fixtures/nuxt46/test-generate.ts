import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const html = await readFile(new URL('.output/public/spa/index.html', import.meta.url), 'utf8')
assert.match(html, /<meta name="robots" content="noindex, nofollow"/)

const ssrHtml = await readFile(new URL('.output/public/static-ssr/index.html', import.meta.url), 'utf8')
assert.equal([...ssrHtml.matchAll(/<meta name="robots"/g)].length, 1)
assert.equal([...html.matchAll(/<meta name="robots"/g)].length, 1)
