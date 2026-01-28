<script setup lang="ts">
import type { BundledLanguage } from 'shiki'
import { computed } from 'vue'
import { renderCodeHighlight } from '../composables/shiki'

const props = withDefaults(
  defineProps<{
    code: string
    lang?: BundledLanguage | 'robots-txt'
    lines?: boolean
    transformRendered?: (code: string) => string
  }>(),
  {
    lang: 'json',
    lines: false,
  },
)
const rendered = computed(() => {
  const code = renderCodeHighlight(props.code, props.lang as any)
  return props.transformRendered ? props.transformRendered(code.value || '') : code.value
})
</script>

<template>
  <pre
    class="code-block p-5"
    :class="lines ? 'code-block-lines' : ''"
    v-html="rendered"
  />
</template>
