const resolve = require('path').resolve
const fs = require('fs')

module.exports = function nuxtRobots (moduleOptions) {
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
    options = Object.assign({}, defaults, this.options.robots, moduleOptions)
  }

  const renderedRobots = render(options)

  // generate robots.txt in dist
  this.nuxt.hook('generate:done', () => {
    const robotsFilePath = resolve(this.options.rootDir, this.options.generate.dir, 'robots.txt')

    fs.writeFileSync(robotsFilePath, renderedRobots)
  })

  // render robots.txt via SSR
  this.addServerMiddleware({
    path: 'robots.txt',
    handler (req, res) {
      res.setHeader('Content-Type', 'text/plain')
      if (res.send) {
        res.send(renderedRobots)
      } else {
        res.end(renderedRobots)
      }
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

  const r = (robots instanceof Array) ? robots : [robots]
  return r.map((robot) => {
    let rules = []
    Object.keys(correspondances).forEach((k) => {
      let arr = []
      if (typeof robot[k] !== 'undefined') {
        if (robot[k] instanceof Array) {
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
