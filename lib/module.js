const resolve = require('path').resolve
const fs = require('fs-extra')

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
  const robotsFilePath = resolve(this.options.srcDir, this.options.dir.static, 'robots.txt')

  fs.removeSync(robotsFilePath)

  // Write robots.txt to the static directory so it gets copied into the dist during generation.
  const generateRobots = () => {
    fs.ensureDirSync(resolve(this.options.srcDir, this.options.dir.static))
    fs.writeFileSync(robotsFilePath, renderedRobots)
  }

  // If `nuxt generate`
  this.nuxt.hook('generate:before', generateRobots)

  // If running in `spa` mode
  if (this.options.mode === 'spa') {
    generateRobots()

  // If `nuxt dev` or `nuxt build`, render robots.txt via SSR
  } else {
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
}

function render (robots) {
  const correspondances = {
    UserAgent: 'User-agent',
    CrawlDelay: 'Crawl-delay',
    Disallow: 'Disallow',
    Allow: 'Allow',
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
