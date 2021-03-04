import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { FILE_NAME, getRules, parseFile } from './utils'
import { RuleInterface } from './types'

let staticRules: RuleInterface[] = []

function setStaticRules (newStaticRules: RuleInterface[]) {
  staticRules = newStaticRules
}

export function getStaticRules () {
  return staticRules
}

export function build () {
  this.nuxt.hook('build:before', async () => {
    const { srcDir, dir: { static: staticDir } } = this.options
    const staticFilePath = resolve(srcDir, staticDir, FILE_NAME)

    if (existsSync(staticFilePath)) {
      const content = readFileSync(staticFilePath).toString()

      setStaticRules(await getRules.call(this, parseFile(content)))
    }
  })
}
