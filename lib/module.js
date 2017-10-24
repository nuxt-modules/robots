const fs = require('fs');
const asArray = require('as-array');

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

function render(robots) {
  return asArray(robots).map(function(robot) {
    var userAgentArray = [];
    if (Array.isArray(robot.UserAgent)) {
      userAgentArray = robot.UserAgent.map(function(userAgent) {
        return 'User-agent: ' + userAgent;
      });
    } else {
      userAgentArray.push('User-agent: ' + robot.UserAgent);
    }
    if (robot.CrawlDelay) {
      userAgentArray.push('Crawl-delay: ' + robot.CrawlDelay);
    }
    return userAgentArray.concat(asArray(robot.Disallow).map(function(disallow) {
      if (Array.isArray(disallow)) {
        return disallow.map(function(line) {
          return 'Disallow: ' + line;
        }).join('\n');
      }
      return 'Disallow: ' + disallow;
    })).join('\n');
  }).join('\n');
}

const defaults = {
  UserAgent: '*',
  Disallow: '/',
};

module.exports = function module(moduleOptions) {
  const options = Object.assign({}, defaults, this.options.robots, moduleOptions);

  const renderedRobots = render(options);

  this.addServerMiddleware({
    path: 'robots.txt',
    handler(req, res, next) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(renderedRobots);
    },
  })
};
