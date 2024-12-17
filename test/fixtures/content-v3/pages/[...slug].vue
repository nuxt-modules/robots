<script setup lang="ts">
import {useRoute, queryCollection} from "#imports";
console.log('query', useRoute().path)
const { data: page } = await useAsyncData(() => queryCollection('content').path(useRoute().path).first())
console.log(page, queryCollection)
useSeoMeta({
  title: page.value?.title,
  description: page.value?.description
})
</script>

<template>
<div>
  <ContentRenderer v-if="page" :value="page" />
  <div v-else>Page not found</div>
</div>
</template>
