<script setup>
const robotRule = useRobotsRule()

function blockAI() {
  robotRule.value = { noai: true }
}

function blockImageAI() {
  robotRule.value = { noimageai: true }
}

function blockBoth() {
  robotRule.value = { noai: true, noimageai: true }
}

function setLargePreview() {
  robotRule.value = { 'max-image-preview': 'large' }
}

function setStandardPreview() {
  robotRule.value = { 'max-image-preview': 'standard' }
}

function setNoPreview() {
  robotRule.value = { 'max-image-preview': 'none' }
}

function setLimitedSnippet() {
  robotRule.value = { 'max-snippet': 120 }
}

function setUnlimitedSnippet() {
  robotRule.value = { 'max-snippet': -1 }
}

function setCustomCombination() {
  // Combine multiple directives
  robotRule.value = {
    'index': true,
    'follow': true,
    'noai': true,
    'max-image-preview': 'standard',
    'max-snippet': 150,
    'max-video-preview': 30,
  }
}

function allowAll() {
  robotRule.value = true
}

// Set initial rule with preview settings
robotRule.value = {
  'max-image-preview': 'large',
  'max-snippet': -1,
}
</script>

<template>
  <div>
    <h1>Robot Directives Test Page</h1>
    <p>This page demonstrates various robot directives including non-standard ones.</p>

    <div>
      <h2>Current robot rule: {{ robotRule }}</h2>

      <h3>AI Directives (Non-standard)</h3>
      <button @click="blockAI">
        Block AI Crawlers
      </button>
      <button @click="blockImageAI">
        Block AI Image Crawlers
      </button>
      <button @click="blockBoth">
        Block AI (Both)
      </button>

      <h3>Preview Directives</h3>
      <button @click="setLargePreview">
        Large Image Preview
      </button>
      <button @click="setStandardPreview">
        Standard Image Preview
      </button>
      <button @click="setNoPreview">
        No Image Preview
      </button>
      <button @click="setLimitedSnippet">
        Limited Text Snippet (120 chars)
      </button>
      <button @click="setUnlimitedSnippet">
        Unlimited Snippet
      </button>

      <h3>Combined Examples</h3>
      <button @click="setCustomCombination">
        Custom Combination
      </button>
      <button @click="allowAll">
        Allow All (Default)
      </button>
    </div>
  </div>
</template>
