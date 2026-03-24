<script setup lang="ts">
import { data } from '../composables/state'
</script>

<template>
  <div class="space-y-5 animate-fade-up">
    <DevtoolsSection
      icon="carbon:settings"
      text="Runtime Config"
    >
      <DevtoolsSnippet
        :code="JSON.stringify(data?.runtimeConfig || {}, null, 2)"
        lang="json"
      />
    </DevtoolsSection>
  </div>
</template>
