<script lang="ts" setup>
import { useRobotsRule } from '#imports'

const rule = useRobotsRule('test')
</script>

<template>
  <div>rule: {{ rule }}</div>
</template>
