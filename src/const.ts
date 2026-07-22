/**
 * A list of bot user agents that may not be helpful for a site.
 *
 * @credits  yoast.com/robots.txt
 */
export const NonHelpfulBots = [
  'Nuclei',
  'WikiDo',
  'Riddler',
  'PetalBot',
  'Zoominfobot',
  'Go-http-client',
  'Node/simplecrawler',
  'CazoodleBot',
  'dotbot/1.0',
  'Gigabot',
  'Barkrowler',
  'BLEXBot',
  'magpie-crawler',
]

/**
 * AI-related robots.txt product tokens for training, search, and user-directed retrieval.
 *
 * Blocking search and retrieval bots can reduce a site's visibility in AI-generated answers.
 * Robots.txt is also voluntary, and some user-triggered fetchers may ignore these directives.
 *
 * @see https://github.com/ai-robots-txt/ai.robots.txt
 */
export const AiBots = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Claude-Web',
  'anthropic-ai',
  // Google
  'Google-Extended',
  'Google-CloudVertexBot',
  'Google-GeminiNotebook',
  'Google-NotebookLM',
  'Google-Agent',
  // Meta
  'meta-externalagent',
  'meta-externalfetcher',
  'FacebookBot',
  // Amazon
  'Amazonbot',
  'Amzn-SearchBot',
  'Amzn-User',
  'bedrockbot',
  // Apple
  'Applebot-Extended',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // ByteDance
  'Bytespider',
  // Webz.io
  'omgili',
  'omgilibot',
  'Webzio-Extended',
  // Yandex
  'YandexAdditional',
  'YandexAdditionalBot',
  // Others
  'CCBot',
  'cohere-ai',
  'Diffbot',
  'ImagesiftBot',
  'MistralAI-User',
  'MistralAI-Index',
  'AI2Bot',
  'DuckAssistBot',
  'FirecrawlAgent',
  'ICC-Crawler',
  'SemrushBot-OCOB',
]
