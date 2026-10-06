<script setup lang="ts">
import { useBotDetection, useRobotsRule } from '#robots/app'
import { useBotDetection as useDeepBotDetection } from '#robots/app/composables/useBotDetection'
const rule = useRobotsRule('noindex, nofollow')
const { isBot } = useBotDetection()
const { isBot: deepBot } = useDeepBotDetection()
</script>

<template>
  <div>{{ rule }}:{{ isBot }}:deep:{{ deepBot }}</div>
</template>
