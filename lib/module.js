const resolve = require('path').resolve
const fs = require('fs')

const correspondances = {
  UserAgent: 'User-agent',
  CrawlDelay: 'Crawl-delay',
  Disallow: 'Disallow',
  Allow: 'Allow',
  Sitemap: 'Sitemap',
};

function render(robots) {
  const r = (robots instanceof Array) ? robots : [robots];
  return r.map((robot) => {
    let rules = [];
    Object.keys(correspondances).forEach((k) => {
      let arr = [];
      if (typeof robot[k] !== 'undefined') {
        if (robot[k] instanceof Array) {
          arr = robot[k].map(value => `${correspondances[k]}: ${value}`);
        } else {
          arr.push(`${correspondances[k]}: ${robot[k]}`);
        }
      }

      rules = rules.concat(arr);
    });

    return rules.join('\n');
  }).join('\n');
}

const defaults = {
  UserAgent: '*',
  Disallow: '',
};

module.exports = function module(moduleOptions) {
  let options = null;
  if (moduleOptions instanceof Array) {
    options = moduleOptions;
  } else if (this.options.robots instanceof Array) {
    options = this.options.robots;
  } else {
    options = Object.assign({}, defaults, this.options.robots, moduleOptions);
  }

  const renderedRobots = render(options);

  // If `nuxt generate` or running in `spa` mode, write robots.txt to the static
  // directory so it gets copied into the dist during generation.
  if (process.env.npm_lifecycle_event == 'generate' || this.options.mode == 'spa') {
    const path = resolve(this.options.srcDir, this.options.dir.static, 'robots.txt')
    fs.writeFileSync(path, renderedRobots)

  // If `nuxt dev` or `nuxt build`, render robots.txt via SSR
  } else {
    this.addServerMiddleware({
      path: 'robots.txt',
      handler(req, res) {
        res.setHeader('Content-Type', 'text/plain');

        if (res.send) {
          res.send(renderedRobots);
        } else {
          res.end(renderedRobots);
        }
      },
    });
  }

};
