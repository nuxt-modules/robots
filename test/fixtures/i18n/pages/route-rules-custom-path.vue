<script lang="ts" setup>
import { defineI18nRoute, defineRouteRules } from '#imports'

defineRouteRules({
  robots: false,
})
defineI18nRoute({
  paths: {
    en: '/other',
    fr: '/autre',
  },
})

// This is broken
</script>

<template>
  <div>route rules custom path</div>
</template>
