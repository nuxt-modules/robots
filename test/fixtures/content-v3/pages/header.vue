<script setup lang="ts">
import { useRobotsRule } from '#robots/app'

const { data: page } = await useAsyncData('header-content', () => queryCollection('content').path('/foo').first())
useSeoMeta(page.value?.seo || {})
useRobotsRule(page.value?.robots ?? undefined)
</script>
<template><div>Content headers</div></template>
