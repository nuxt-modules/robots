const { resolve } = require('path')
const { writeFileSync } = require('fs')

function nuxtRobots (moduleOptions) {
  const defaults = {
    UserAgent: '*',
    Disallow: ''
  }

  let options = null
  if (Array.isArray(moduleOptions)) {
    options = moduleOptions
  } else if (Array.isArray(this.options.robots)) {
    options = this.options.robots
  } else {
    options = {
      ...defaults,
      ...this.options.robots,
      ...moduleOptions
    }
  }

  const renderedRobots = render(options)

  // generate robots.txt in dist
  this.nuxt.hook('generate:done', () => {
    const robotsFilePath = resolve(this.options.rootDir, this.options.generate.dir, 'robots.txt')

    writeFileSync(robotsFilePath, renderedRobots)
  })

  // render robots.txt via SSR
  this.addServerMiddleware({
    path: 'robots.txt',
    handler (req, res) {
      res.setHeader('Content-Type', 'text/plain')
      res.end(renderedRobots)
    }
  })
}

function render (robots) {
  const correspondances = {
    UserAgent: 'User-agent',
    CrawlDelay: 'Crawl-delay',
    Disallow: 'Disallow',
    Allow: 'Allow',
    Host: 'Host',
    Sitemap: 'Sitemap'
  }

  const r = Array.isArray(robots) ? robots : [robots]
  return r.map((robot) => {
    let rules = []
    Object.keys(correspondances).forEach((k) => {
      let arr = []
      if (typeof robot[k] !== 'undefined') {
        if (Array.isArray(robot[k])) {
          arr = robot[k].map(value => `${correspondances[k]}: ${value}`)
        } else {
          arr.push(`${correspondances[k]}: ${robot[k]}`)
        }
      }

      rules = rules.concat(arr)
    })

    return rules.join('\n')
  }).join('\n')
}

module.exports = nuxtRobots
module.exports.meta = require('../package.json')
