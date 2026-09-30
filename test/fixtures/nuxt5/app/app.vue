<script setup lang="ts">
import { useBotDetection } from '#robots/app/composables/useBotDetection'
import { useRobotsRule } from '#robots/app/composables/useRobotsRule'
const rule = useRobotsRule('noindex, nofollow')
const { isBot } = useBotDetection()
</script>

<template>
  <div>{{ rule }}:{{ isBot }}</div>
</template>
