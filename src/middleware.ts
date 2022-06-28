import { getStaticFooter, getStaticHeader, getStaticRules } from './build'
import { RuleInterface, Rule } from './types'
import { FILE_NAME, getRules, render } from './utils'

function resolveHeader (header, staticHeader) {
  if (header) { return header }

  if (staticHeader) { return staticHeader }

  return ''
}

function resolveFooter (footer, staticHeader) {
  if (footer) { return footer }

  if (staticHeader) { return staticHeader }

  return ''
}

export function middleware (options: Rule[]) {
  this.nuxt.hook('render:setupMiddleware', () => {
    const moduleContainer = this

    this.nuxt.server.useMiddleware({
      path: FILE_NAME,
      async handler (req, res) {
        const rules: RuleInterface[] = await getRules.call(moduleContainer, options, req)
        const header = resolveHeader(((options[0]?.Header || '') as string).split('\n').filter(Boolean).map(str => `# ${str}`).join(), getStaticHeader())
        const footer = resolveFooter(((options[0]?.Footer || '') as string).split('\n').filter(Boolean).map(str => `# ${str}`).join(), getStaticFooter())

        res.setHeader('Content-Type', 'text/plain')
        res.end(render(header, [...getStaticRules(), ...rules], footer))
      }
    })
  })
}
