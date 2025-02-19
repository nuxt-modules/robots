import type { MaybeRef } from '@vueuse/core'
import type { HighlighterCore } from 'shiki'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { computed, ref, toValue } from 'vue'
import { devtools } from './rpc'

export const shiki = ref<HighlighterCore>()

export async function loadShiki() {
  // Only loading when needed
  shiki.value = await createHighlighterCore({
    themes: [
      import('@shikijs/themes/vitesse-light'),
      import('@shikijs/themes/vitesse-dark'),
    ],
    langs: [
      import('@shikijs/langs/json'),
      import('@shikijs/langs/html'),
      import('@shikijs/langs/bash'),
      Object.freeze({
        displayName: 'robots.txt',
        name: 'robots-txt',
        patterns: [
          { include: '#main' },
        ],
        repository: {
          $base: { patterns: [] },
          $self: { name: 'source.robots-txt' },
          main: {
            patterns: [
              { include: '#comment' },
              { include: '#directive' },
              { include: '#wildcard' },
              { include: '#uri' },
              { include: '#text' },
              { include: '#number' },
            ],
          },
          comment: {
            name: 'comment.line.hash.robots-txt',
            begin: '#',
            end: '$',
            beginCaptures: {
              0: { name: 'punctuation.definition.comment.robots-txt' },
            },
          },
          directive: {
            name: 'keyword.control.directive.robots-txt',
            begin: '^[A-Z][a-z-]*',
            end: '\\s*:',
          },
          wildcard: {
            name: 'constant.character.wildcard.robots-txt',
            match: '\\*',
          },
          uri: {
            name: 'string.unquoted.uri.robots-txt',
            begin: '(?:[a-z]+:)\\/',
            end: '$',
          },
          text: {
            name: 'string.unquoted.text.robots-txt',
            match: '[A-Za-z-]+',
          },
          number: {
            name: 'constant.numeric.integer.robots-txt',
            match: '\\d',
          },
        },
        scopeName: 'text.robots-txt',
      }),
    ],
    engine: createJavaScriptRegexEngine(),
  })
  return shiki.value
}

export function renderCodeHighlight(code: MaybeRef<string>, lang: 'json' | 'html' | 'bash' | 'robots-txt') {
  return computed(() => {
    const colorMode = devtools.value?.colorMode || 'light'
    return shiki.value!.codeToHtml(toValue(code), {
      lang,
      theme: colorMode === 'dark' ? 'vitesse-dark' : 'vitesse-light',
    }) || ''
  })
}
