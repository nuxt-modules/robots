import { readdirSync, readFileSync } from 'node:fs'
import { get } from 'node:http'
import { join } from 'node:path'
import { url, useTestContext } from '@nuxt/test-utils'

/**
 * Every `X-Robots-Tag` value of a real response, one entry per header line.
 * `fetch` joins repeated headers, so this reads the raw headers instead.
 */
export function fetchRobotsHeaders(path: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    get(url(path), (res) => {
      res.resume()
      const values: string[] = []
      for (let i = 0; i < res.rawHeaders.length; i += 2) {
        if (res.rawHeaders[i]!.toLowerCase() === 'x-robots-tag')
          values.push(res.rawHeaders[i + 1]!)
      }
      resolve(values)
    }).on('error', reject)
  })
}

// Node and Cloudflare presets both write static files to `<output>/public`.
function publicDir() {
  return join(useTestContext().nuxt!.options.nitro.output!.dir!, 'public')
}

/** Path of one real build asset, such as `/_nuxt/entry.js`. */
export function findBuildAsset(): string {
  const file = readdirSync(join(publicDir(), '_nuxt')).find(f => f.endsWith('.js'))
  if (!file)
    throw new Error('The build wrote no JS files to `/_nuxt`.')
  return `/_nuxt/${file}`
}

/** The `_headers` file that the preset wrote to the public output directory. */
export function readHeadersFile(): string {
  return readFileSync(join(publicDir(), '_headers'), 'utf8')
}

/**
 * Every `X-Robots-Tag` value that a static host applies to the path.
 * Cloudflare and Netlify apply every `_headers` rule whose pattern matches.
 */
export function staticRobotsHeaders(headersFile: string, path: string): string[] {
  const values: string[] = []
  let matches = false
  for (const line of headersFile.split('\n')) {
    if (!line.trim())
      continue
    if (!line.startsWith(' ')) {
      const pattern = new RegExp(`^${line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`)
      matches = pattern.test(path)
      continue
    }
    const [name, ...value] = line.trim().split(':')
    if (matches && name!.toLowerCase() === 'x-robots-tag')
      values.push(value.join(':').trim())
  }
  return values
}
