<script lang="ts" setup>
import { useBotDetection } from '#robots/app/composables/useBotDetection'

const bot = useBotDetection()
</script>

<template>
  <div>
    <div>
      <NuxtLink to="/secret">
        Secret page - not crawlable
      </NuxtLink>
      <div>
        Is Bot: {{ bot }}
      </div>
    </div>
  </div>
</template>
