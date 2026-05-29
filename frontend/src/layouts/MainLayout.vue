<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <Sidebar />
    <main class="flex-1 overflow-auto p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue'
</script>
