<script setup lang="ts">
import { useRuntimeConfig, useSeoMeta } from 'nuxt/app'

defineProps<{ error: { statusCode: number } }>()

const config = useRuntimeConfig()
if (config.public.errorRobots)
  useSeoMeta({ robots: String(config.public.errorRobots) })
</script>

<template>
  <h1>{{ error.statusCode }}</h1>
</template>
