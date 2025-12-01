<script setup lang="ts">
async function login() {
  await $fetch('/api/login')
  location.reload()
}

async function logout() {
  await $fetch('/api/logout')
  location.reload()
}
</script>

<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h2>Auth Test</h2>
      <button style="margin-right: 10px;" @click="login">
        Login (set cookie)
      </button>
      <button @click="logout">
        Logout (clear cookie)
      </button>
    </div>
    <div>
      <NuxtLink to="/admin">
        Admin page - requires auth
      </NuxtLink>
    </div>
    <div>
      <NuxtLink to="/secret">
        Secret page - not crawlable
      </NuxtLink>
    </div>
  </div>
</template>
