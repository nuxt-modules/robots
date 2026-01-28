<script lang="ts" setup>
import { useRobotsRule } from '#imports'

const rule = useRobotsRule(false)
</script>

<template>
  <div>rule: {{ rule }}</div>
</template>
