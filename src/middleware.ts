import { getStaticRules } from './build'
import { RuleInterface, Rule } from './types'
import { FILE_NAME, getRules, render } from './utils'

export function middleware (options: Rule[]) {
  this.nuxt.hook('render:setupMiddleware', () => {
    const moduleContainer = this

    this.nuxt.server.useMiddleware({
      path: FILE_NAME,
      async handler (req, res) {
        const rules: RuleInterface[] = await getRules.call(moduleContainer, options, req)

        res.setHeader('Content-Type', 'text/plain')
        res.end(render([...getStaticRules(), ...rules]))
      }
    })
  })
}
