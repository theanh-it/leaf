<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <div class="app">
    <h1>Leaf App</h1>
    <p class="subtitle">SCSS is now working! 🎉</p>
    <button @click="count++">{{ count }}</button>
  </div>
</template>

<style lang="scss" scoped>
// Variables và mixins đã được tự động inject bởi Vite config!
// Không cần import nữa

.app {
  flex-direction: column;
  min-height: 100vh;
  padding: $spacing-8;

  h1 {
    color: $primary;
    margin-bottom: $spacing-4;
    font-size: $font-size-4xl;
  }

  .subtitle {
    color: $gray-600;
    font-size: $font-size-lg;
  }
}
</style>
