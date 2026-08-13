<script setup lang="ts">
import { useRuntimeConfig, useSeoMeta } from '#imports'

const content = useRuntimeConfig().public.contentHook as { seo: Record<string, string> }
useSeoMeta(content.seo)
</script>

<template>
  <main>Generic content hook provider</main>
</template>
