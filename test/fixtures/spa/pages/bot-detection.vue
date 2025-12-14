<script lang="ts" setup>
import { useBotDetection } from '#robots/app/composables/useBotDetection'

const { isBot, botName, trusted } = useBotDetection()
</script>

<template>
  <div>
    <div data-test-id="is-bot">
      is bot: {{ isBot }}
    </div>
    <div data-test-id="bot-name">
      bot name: {{ botName }}
    </div>
    <div data-test-id="trusted">
      trusted: {{ trusted }}
    </div>
  </div>
</template>
