import type { BundledLanguage, Highlighter } from 'shiki'
import { getHighlighter } from 'shiki'
import { ref } from 'vue'
import { useColorMode } from '#imports'

export const shiki = ref<Highlighter>()
const mode = useColorMode()

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
  if (!shiki.value)
    return code
  return shiki.value.codeToHtml(code, {
    lang,
    theme: mode.value === 'dark' ? 'vitesse-dark' : 'vitesse-light',
  })
}
