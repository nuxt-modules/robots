import type { BundledLanguage, Highlighter } from 'shikiji'
import { getHighlighter } from 'shikiji'
import { ref } from 'vue'
import { useColorMode } from '#imports'

export const shiki = ref<Highlighter>()

// TODO: Only loading when needed
getHighlighter({
  themes: [
    'vitesse-dark',
    'vitesse-light',
  ],
  langs: [
    'html',
    'json',
  ],
}).then((i) => { shiki.value = i })

export function highlight(code: string, lang: BundledLanguage) {
  const mode = useColorMode()
  if (!shiki.value)
    return code
  return shiki.value.codeToHtml(code, {
    lang,
    theme: mode.value === 'dark' ? 'vitesse-dark' : 'vitesse-light',
  })
}
