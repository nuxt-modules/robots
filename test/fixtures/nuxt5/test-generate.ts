import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const html = await readFile(new URL('.output/public/spa/index.html', import.meta.url), 'utf8')
assert.match(html, /<meta name="robots" content="noindex, nofollow"/)
