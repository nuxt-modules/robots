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
        const header = ((options[0]?.Header || '') as string).split('\n').filter(Boolean).map(str => `# ${str}`).join()

        res.setHeader('Content-Type', 'text/plain')
        res.end(render(header, [...getStaticRules(), ...rules]))
      }
    })
  })
}
