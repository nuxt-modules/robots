import fsp from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url))

export default async function setup() {
  for (const project of await fsp.readdir(fixturesDir)) {
    await fsp.rm(join(fixturesDir, project, 'node_modules/.cache'), {
      recursive: true,
      force: true,
    })
    await fsp.rm(join(fixturesDir, project, '.data'), {
      recursive: true,
      force: true,
    })
  }
}
