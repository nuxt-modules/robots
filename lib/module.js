const { resolve } = require('path')
const { writeFileSync } = require('fs')

function robotsModule(moduleOptions) {
  const options = getOptions.call(this, moduleOptions)

  // generate robots.txt in dist
  this.nuxt.hook('generate:done', async () => {
    const robotsFilePath = resolve(this.options.rootDir, this.options.generate.dir, 'robots.txt')

    writeFileSync(robotsFilePath, await render(options))
  })

  // render robots.txt via SSR
  this.addServerMiddleware({
    path: 'robots.txt',
    async handler(req, res) {
      res.setHeader('Content-Type', 'text/plain')
      res.end(await render(options, req))
    }
  })
}

function getOptions(moduleOptions) {
  const defaults = {
    UserAgent: '*',
    Disallow: ''
  }

  let options = null
  if (moduleOptions instanceof Array) {
    options = moduleOptions
  } else if (this.options.robots instanceof Array) {
    options = this.options.robots
  } else {
    options = {
      ...defaults,
      ...this.options.robots,
      ...moduleOptions
    }
  }

  return options
}

async function render(options, req = null) {
  const correspondances = {
    UserAgent: 'User-agent',
    CrawlDelay: 'Crawl-delay',
    Disallow: 'Disallow',
    Allow: 'Allow',
    Host: 'Host',
    Sitemap: 'Sitemap',
    CleanParam: 'Clean-param'
  }

  const content = []
  const robots = (options instanceof Array) ? options : [options]

  for (const robot of robots) {
    const rules = []
    const keys = Object.keys(correspondances).filter(key => typeof robot[key] !== 'undefined')

    for (const key of keys) {
      const values = (robot[key] instanceof Array) ? robot[key] : [robot[key]]

      for (const value of values) {
        rules.push(`${correspondances[key]}: ${typeof value === 'function' ? await value(req) : value}`)
      }
    }

    content.push(rules.join('\n'))
  }

  return content.join('\n')
}

module.exports = robotsModule
module.exports.meta = require('../package.json')
