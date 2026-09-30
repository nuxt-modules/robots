<script setup lang="ts">
const rule = useRobotsRule('noindex, nofollow')
const { isBot } = useBotDetection()
</script>

<template>
  <div>{{ rule }}:{{ isBot }}</div>
</template>
