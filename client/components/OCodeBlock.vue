<script setup lang="ts">
import { computed } from 'vue'
import { renderCodeHighlight } from '../composables/shiki'

const props = withDefaults(
  defineProps<{
    code: string
    lang: 'json' | 'html' | 'bash' | 'robots-txt'
    lines?: boolean
    transformRendered?: (code: string) => string
  }>(),
  {
    lines: false,
  },
)
const rendered = computed(() => {
  const code = renderCodeHighlight(props.code, props.lang)
  return props.transformRendered ? props.transformRendered(code.value || '') : code.value
})
</script>

<template>
  <pre
    class="n-code-block p-5"
    :class="lines ? 'n-code-block-lines' : ''"
    v-html="rendered"
  />
</template>

<style>
.n-code-block-lines .shiki code .line::before {
  display: none;
}
</style>
