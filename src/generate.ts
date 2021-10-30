import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { getStaticRules } from './build'
import { RuleInterface, Rule } from './types'
import { FILE_NAME, getRules, render } from './utils'

export function generate (options: Rule[]) {
  this.nuxt.hook('generate:done', async () => {
    await this.nuxt.callHook('robots:generate:before', this, options)
    const { rootDir, generate: { dir: generateDir } } = this.options
    const generateFilePath = resolve(rootDir, generateDir, FILE_NAME)
    const rules: RuleInterface[] = await getRules.call(this, options)

    writeFileSync(generateFilePath, render([...getStaticRules(), ...rules]))
    await this.nuxt.callHook('robots:generate:done', this)
  })
}
