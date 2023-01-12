export type RuleValue = string | boolean | Function | (string | boolean | Function)[]

export type Rule = {
  /**
   * The Allow directive tells search engine crawlers which URLs should be
   * allowed to be accessed by the crawler.
   *
   * @example
   * Allow: '/path/to/page'
   * Allow: ['/path/to/page', '/path/to/other/page']
   */
  Allow?: RuleValue;
  /**
   * The BlankLine directive tells search engine crawlers that the line is
   * a blank line and should be ignored.
   *
   * @example
   * BlankLine: true
   */
  BlankLine?: RuleValue;
  /**
   * The CleanParam directive tells search engine crawlers which parameters
   * should be removed from the URL before it is crawled.
   *
   * @example
   * CleanParam: 'param1 param2 /regex/'
   * CleanParam: ['param1', 'param2', '/regex/']
   */
  CleanParam?: RuleValue;
  /**
   * The Comment directive tells search engine crawlers that the line is a
   * comment and should be ignored.
   *
   * @example
   * Comment: 'This is a comment'
   */
  Comment?: RuleValue;
  /**
   * The CrawlDelay directive tells search engine crawlers how long to wait
   * between requests to the site.
   *
   * @example
   * CrawlDelay: 5
   */
  CrawlDelay?: RuleValue;
  /**
   * The Disallow directive tells search engine crawlers which URLs should
   * not be accessed by the crawler.
   *
   * @example
   * Disallow: '/path/to/page'
   * Disallow: ['/path/to/page', '/path/to/other/page']
   */
  Disallow?: RuleValue;
  /**
   * The Host directive tells search engine crawlers which host to use when
   * crawling the site.
   *
   * @example
   * Host: 'https://example.com'
   * Host: ['https://example.com', 'https://www.example.com']
   */
  Host?: RuleValue;
  /**
   * The Sitemap directive tells search engine crawlers where to find the
   * sitemap for the site.
   *
   * @example
   * Sitemap: 'https://example.com/sitemap.xml'
   * Sitemap: (req: IncomingMessage) => `https://${req.headers.host}/sitemap.xml`
   */
  Sitemap?: RuleValue;
  /**
   * The User-Agent directive tells search engine crawlers which crawler
   * should be allowed to access the site.
   *
   * @example
   * UserAgent: 'Googlebot'
   * UserAgent: ['Googlebot', 'Bingbot']
   */
  UserAgent?: RuleValue;
};

export type RuleSet = Rule | Rule[];
