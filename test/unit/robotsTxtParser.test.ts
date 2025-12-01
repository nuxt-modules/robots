import fsp from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { parseRobotsTxt } from '../../src/runtime/util'

describe('robotsTxtParser', () => {
  it('yoast', async () => {
    // read fixture yoastRobots.txt
    const robotsTxt = await fsp.readFile('./test/fixtures/yoastRobots.txt', { encoding: 'utf-8' })
    expect(parseRobotsTxt(robotsTxt)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "groups": [
          {
            "allow": [],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/wp-json/",
              "/?s=*",
              "/search/*",
              "/cdn-cgi/bm/cv/",
              "/cdn-cgi/challenge-platform/",
            ],
            "userAgent": [
              "*",
            ],
          },
          {
            "allow": [],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/",
            ],
            "userAgent": [
              "Nuclei",
              "WikiDo",
              "Riddler",
              "PetalBot",
              "Zoominfobot",
              "Go-http-client",
              "Node/simplecrawler",
              "CazoodleBot",
              "dotbot/1.0",
              "Gigabot",
              "Barkrowler",
              "BLEXBot",
              "magpie-crawler",
            ],
          },
        ],
        "sitemaps": [
          "https://yoast.com/sitemap_index.xml",
        ],
      }
    `)
  })

  it('squareSpace', async () => {
    // read fixture yoastRobots.txt
    const robotsTxt = await fsp.readFile('./test/fixtures/squareSpace.txt', { encoding: 'utf-8' })
    expect(parseRobotsTxt(robotsTxt)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "groups": [
          {
            "allow": [
              "/api/ui-extensions/",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/config",
              "/search",
              "/account$",
              "/account/",
              "/commerce/digital-download/",
              "/api/",
              "/static/",
              "/*?author=*",
              "/*&author=*",
              "/*?tag=*",
              "/*&tag=*",
              "/*?month=*",
              "/*&month=*",
              "/*?view=*",
              "/*&view=*",
              "/*?format=json",
              "/*&format=json",
              "/*?format=page-context",
              "/*&format=page-context",
              "/*?format=main-content",
              "/*&format=main-content",
              "/*?format=json-pretty",
              "/*&format=json-pretty",
              "/*?format=ical",
              "/*&format=ical",
              "/*?reversePaginate=*",
              "/*&reversePaginate=*",
            ],
            "userAgent": [
              "AdsBot-Google",
            ],
          },
          {
            "allow": [
              "/api/ui-extensions/",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/config",
              "/search",
              "/account$",
              "/account/",
              "/commerce/digital-download/",
              "/api/",
              "/static/",
              "/*?author=*",
              "/*&author=*",
              "/*?tag=*",
              "/*&tag=*",
              "/*?month=*",
              "/*&month=*",
              "/*?view=*",
              "/*&view=*",
              "/*?format=json",
              "/*&format=json",
              "/*?format=page-context",
              "/*&format=page-context",
              "/*?format=main-content",
              "/*&format=main-content",
              "/*?format=json-pretty",
              "/*&format=json-pretty",
              "/*?format=ical",
              "/*&format=ical",
              "/*?reversePaginate=*",
              "/*&reversePaginate=*",
            ],
            "userAgent": [
              "AdsBot-Google-Mobile",
            ],
          },
          {
            "allow": [
              "/api/ui-extensions/",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/config",
              "/search",
              "/account$",
              "/account/",
              "/commerce/digital-download/",
              "/api/",
              "/static/",
              "/*?author=*",
              "/*&author=*",
              "/*?tag=*",
              "/*&tag=*",
              "/*?month=*",
              "/*&month=*",
              "/*?view=*",
              "/*&view=*",
              "/*?format=json",
              "/*&format=json",
              "/*?format=page-context",
              "/*&format=page-context",
              "/*?format=main-content",
              "/*&format=main-content",
              "/*?format=json-pretty",
              "/*&format=json-pretty",
              "/*?format=ical",
              "/*&format=ical",
              "/*?reversePaginate=*",
              "/*&reversePaginate=*",
            ],
            "userAgent": [
              "AdsBot-Google-Mobile-Apps",
            ],
          },
          {
            "allow": [
              "/api/ui-extensions/",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/config",
              "/search",
              "/account$",
              "/account/",
              "/commerce/digital-download/",
              "/api/",
              "/static/",
              "/*?author=*",
              "/*&author=*",
              "/*?tag=*",
              "/*&tag=*",
              "/*?month=*",
              "/*&month=*",
              "/*?view=*",
              "/*&view=*",
              "/*?format=json",
              "/*&format=json",
              "/*?format=page-context",
              "/*&format=page-context",
              "/*?format=main-content",
              "/*&format=main-content",
              "/*?format=json-pretty",
              "/*&format=json-pretty",
              "/*?format=ical",
              "/*&format=ical",
              "/*?reversePaginate=*",
              "/*&reversePaginate=*",
            ],
            "userAgent": [
              "*",
            ],
          },
        ],
        "sitemaps": [
          "https: //www.example.com/sitemap.xml",
        ],
      }
    `)
  })

  it('robots #36', async () => {
    // read fixture yoastRobots.txt
    const robotsTxt = await fsp.readFile('./test/fixtures/issue36.txt', { encoding: 'utf-8' })
    expect(parseRobotsTxt(robotsTxt)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "groups": [
          {
            "allow": [],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "",
            ],
            "host": "https://doyban.com",
            "userAgent": [
              "*",
            ],
          },
        ],
        "sitemaps": [
          "https://doyban.com/sitemap.xml",
        ],
      }
    `)
  })

  it('yandex', async () => {
    // read fixture yandex.txt
    const robotsTxt = await fsp.readFile('./test/fixtures/yandex.txt', { encoding: 'utf-8' })
    expect(parseRobotsTxt(robotsTxt)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "groups": [
          {
            "allow": [],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/cdn-cgi/challenge-platform/",
            ],
            "userAgent": [
              "*",
            ],
          },
          {
            "allow": [],
            "cleanParam": [
              "s /forum/index.php",
              "s /forum/showthread.php",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "",
            ],
            "userAgent": [
              "Yandex",
            ],
          },
        ],
        "sitemaps": [
          "https://yoast.com/sitemap_index.xml",
        ],
      }
    `)
  })

  it('case-insensitive startgroupline', async () => {
    // read fixture startgroupRobots.txt
    const robotsTxt = await fsp.readFile('./test/fixtures/startgroupRobots.txt', { encoding: 'utf-8' })
    expect(parseRobotsTxt(robotsTxt)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "groups": [
          {
            "allow": [
              "/bar",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/foo",
            ],
            "userAgent": [
              "ExampleBot",
            ],
          },
          {
            "allow": [
              "/boo",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/baz",
            ],
            "userAgent": [
              "examplebot",
            ],
          },
          {
            "allow": [],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/invalid",
            ],
            "userAgent": [
              "",
            ],
          },
          {
            "allow": [],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [
              "/star",
            ],
            "userAgent": [
              "*",
            ],
          },
        ],
        "sitemaps": [],
      }
    `)
  })

  it('collects errors', async () => {
    // read fixture startgroupRobots.txt
    expect(parseRobotsTxt(`
User-Agent: *
Disallow: /foo
Unknown: /bar
    `).errors).toMatchInlineSnapshot(`
      [
        "L3: Unknown directive unknown ",
      ]
    `)
  })

  it('comments do not error', async () => {
    const robotsTxt = await fsp.readFile('./test/fixtures/comments.txt', { encoding: 'utf-8' })
    expect(parseRobotsTxt(robotsTxt)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "groups": [
          {
            "allow": [
              "/",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [],
            "disallow": [],
            "userAgent": [
              "*",
            ],
          },
        ],
        "sitemaps": [],
      }
    `)
  })

  it('content-usage directive parsing', () => {
    const robotsTxt = `
User-Agent: *
Allow: /
Content-Usage: bots=y
Content-Usage: /public/ train-ai=y
Content-Usage: /restricted/ train-ai=n, ai-output=n
    `
    expect(parseRobotsTxt(robotsTxt)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "groups": [
          {
            "allow": [
              "/",
            ],
            "comment": [],
            "contentSignal": [],
            "contentUsage": [
              "bots=y",
              "/public/ train-ai=y",
              "/restricted/ train-ai=n, ai-output=n",
            ],
            "disallow": [],
            "userAgent": [
              "*",
            ],
          },
        ],
        "sitemaps": [],
      }
    `)
  })

  it('content-usage validation errors', () => {
    const robotsTxt = `
User-Agent: *
Content-Usage: invalid-preference
Content-Usage: invalid-path ai=n
Content-Usage:
    `
    expect(parseRobotsTxt(robotsTxt).errors).toEqual([])
  })

  it('content-signal directive parsing', () => {
    const robotsTxt = `
User-Agent: *
Allow: /
Content-Signal: ai-train=no
Content-Signal: /public/ search=yes, ai-input=yes
Content-Signal: /restricted/ ai-train=no, ai-input=no
    `
    expect(parseRobotsTxt(robotsTxt)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "groups": [
          {
            "allow": [
              "/",
            ],
            "comment": [],
            "contentSignal": [
              "ai-train=no",
              "/public/ search=yes, ai-input=yes",
              "/restricted/ ai-train=no, ai-input=no",
            ],
            "contentUsage": [],
            "disallow": [],
            "userAgent": [
              "*",
            ],
          },
        ],
        "sitemaps": [],
      }
    `)
  })
})
