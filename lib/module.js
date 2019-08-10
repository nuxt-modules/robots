const { resolve } = require('path')
const { existsSync, readFileSync, writeFileSync } = require('fs')

module.exports = async function (moduleOptions) {
  const { rootDir, srcDir, dir: { static: staticDir }, generate: { dir: generateDir } } = this.options
  const options = await getOptions.call(this, moduleOptions)
  const fileName = 'robots.txt'
  let staticRules = []

  // read static robots.txt
  this.nuxt.hook('build:before', async () => {
    const staticFilePath = resolve(srcDir, staticDir, fileName)

    if (existsSync(staticFilePath)) {
      const content = readFileSync(staticFilePath).toString()

      staticRules = await getRules.call(this, parseFile(content))
    }
  })

  // generate robots.txt in dist
  this.nuxt.hook('generate:done', async () => {
    const generateFilePath = resolve(rootDir, generateDir, fileName)
    const rules = await getRules.call(this, options)

    writeFileSync(generateFilePath, render([...staticRules, ...rules]))
  })

  // render robots.txt via SSR
  this.nuxt.hook('render:setupMiddleware', () => {
    const moduleContainer = this

    this.nuxt.server.useMiddleware({
      path: fileName,
      async handler (req, res) {
        const rules = await getRules.call(moduleContainer, options, req)

        res.setHeader('Content-Type', 'text/plain')
        res.end(render([...staticRules, ...rules]))
      }
    })
  })
}

async function getOptions (moduleOptions) {
  if (typeof moduleOptions === 'function') {
    moduleOptions = await moduleOptions.call(this)
  }

  if (Array.isArray(moduleOptions)) {
    return moduleOptions
  }

  let { robots } = this.options

  if (typeof robots === 'function') {
    robots = await robots.call(this)
  }

  if (Array.isArray(robots)) {
    return robots
  }

  return {
    UserAgent: '*',
    Disallow: '',
    ...robots,
    ...moduleOptions
  }
}

async function getRules (options, req = null) {
  const correspondances = {
    UserAgent: 'User-agent',
    CrawlDelay: 'Crawl-delay',
    Disallow: 'Disallow',
    Allow: 'Allow',
    Host: 'Host',
    Sitemap: 'Sitemap',
    CleanParam: 'Clean-param',
    'User-agent': 'User-agent',
    'Crawl-delay': 'Crawl-delay',
    'Clean-param': 'Clean-param'
  }

  const rules = []
  const items = Array.isArray(options) ? options : [options]

  for (const item of items) {
    const keys = Object.keys(correspondances).filter(key => typeof item[key] !== 'undefined')

    for (const key of keys) {
      let values = typeof item[key] === 'function' ? await item[key].call(this, req) : item[key]
      values = (Array.isArray(values)) ? values : [values]

      for (const value of values) {
        rules.push({
          key: correspondances[key],
          value: typeof value === 'function' ? await value.call(this, req) : value
        })
      }
    }
  }

  return rules
}

function render (rules) {
  return rules.map(rule => `${rule.key}: ${String(rule.value).trim()}`).join('\n')
}

function parseFile (content) {
  const rules = []

  content.split('\n').forEach((item) => {
    const ar = item.split(':')

    if (ar[0]) {
      rules.push({
        [ar[0]]: ar[1]
      })
    }
  })

  return rules
}

module.exports.meta = require('../package.json')
