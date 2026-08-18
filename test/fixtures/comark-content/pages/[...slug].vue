<script setup lang="ts">
import { queryCollection, useRoute } from '#imports'

const route = useRoute()
const { data: page } = await useAsyncData(`page-${route.path}`, () => {
  return queryCollection('content').path(route.path).first()
})
useSeoMeta(page.value.seo)
</script>

<template>
  <div>
    <ContentRenderer v-if="page" :value="page" />
    <div v-else>
      Page not found
    </div>
  </div>
</template>
