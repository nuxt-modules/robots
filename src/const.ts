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
 * A list of AI crawler user agents, both training and retrieval.
 *
 * Search crawlers are deliberately excluded, so `blockAiBots` never costs a site its search
 * visibility. This is why `Googlebot`, `Applebot` (Siri, Spotlight) and `facebookexternalhit`
 * (Open Graph previews) are absent, while their AI-only counterparts `Google-Extended` and
 * `Applebot-Extended` are listed.
 *
 * @credits https://github.com/ai-robots-txt/ai.robots.txt
 */
export const AiBots = [
  // OpenAI
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  // Anthropic
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'Claude-Web',
  'anthropic-ai',
  // Google
  'Google-Extended',
  'Google-CloudVertexBot',
  'Google-NotebookLM',
  'Gemini-Deep-Research',
  'GoogleOther',
  // Meta
  'meta-externalagent',
  'meta-externalfetcher',
  'FacebookBot',
  // Amazon
  'Amazonbot',
  'bedrockbot',
  // Apple
  'Applebot-Extended',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // ByteDance
  'Bytespider',
  'TikTokSpider',
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
  'DeepSeekBot',
  'AI2Bot',
  'Ai2Bot-Dolma',
  'YouBot',
  'Timpibot',
  'PanguBot',
  'DuckAssistBot',
  'FirecrawlAgent',
  'ICC-Crawler',
  'Kangaroo Bot',
  'SemrushBot-OCOB',
  'img2dataset',
]
