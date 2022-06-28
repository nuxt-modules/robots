import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { FILE_NAME, getRules, parseFile } from './utils'
import { RuleInterface } from './types'

let staticRules: RuleInterface[] = []
let staticHeader: string = ''
let staticFooter: string = ''

function setStaticHeader (newStaticHeader: string) {
  staticHeader = newStaticHeader
}

export function getStaticHeader () {
  return staticHeader
}

function setStaticFooter (newStaticFooter: string) {
  staticFooter = newStaticFooter
}

export function getStaticFooter () {
  return staticFooter
}

function setStaticRules (newStaticRules: RuleInterface[]) {
  staticRules = newStaticRules
}

export function getStaticRules () {
  return staticRules
}

function parseFileComments (content: string) {
  return content.split('\n').filter(str => str.indexOf('#') === 0).join('\n')
}

export function build () {
  this.nuxt.hook('build:before', async () => {
    const { srcDir, dir: { static: staticDir } } = this.options
    const staticFilePath = resolve(srcDir, staticDir, FILE_NAME)

    if (existsSync(staticFilePath)) {
      const content = readFileSync(staticFilePath).toString()

      setStaticHeader(parseFileComments(content))
      setStaticFooter('')

      setStaticRules(await getRules.call(this, parseFile(content)))
    }
  })
}
