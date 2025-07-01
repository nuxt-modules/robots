<script lang="ts" setup>
import { useBotDetection } from '#robots/app/composables/useBotDetection'

const { isBot, botName, botCategory, trusted } = useBotDetection({
  fingerprint: true,
})
</script>

<template>
  <div>
    <ClientOnly>
      <div data-test-id="is-bot">
        is bot: {{ isBot }}
      </div>
      <div data-test-id="bot-name">
        bot name: {{ botName }}
      </div>
      <div data-test-id="bot-category">
        bot category: {{ botCategory }}
      </div>
      <div data-test-id="trusted">
        trusted: {{ trusted }}
      </div>
    </ClientOnly>
  </div>
</template>
