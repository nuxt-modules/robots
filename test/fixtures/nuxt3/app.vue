<script setup lang="ts">
import { useBotDetection, useRobotsRule } from '#imports'

const rule = useRobotsRule('noindex, nofollow')
const { isBot } = useBotDetection()
</script>

<template>
  <div>{{ rule }}:{{ isBot }}</div>
</template>
