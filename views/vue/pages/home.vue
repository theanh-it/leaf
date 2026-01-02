<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <div class="app">
    <router-link to="/about">About</router-link>
    <h1 class="title">Leaf App</h1>
    <p class="subtitle">SCSS is now working! 🎉</p>
  </div>
</template>

<style lang="scss" scoped>
// Variables và mixins đã được tự động inject bởi Vite config!
// Không cần import nữa

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;

  .title {
    background-image: linear-gradient(to right, #a30000, #5200ff);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-clip: text;
    color: transparent;
    animation: gradient 20s linear infinite;
  }

  .subtitle {
    color: $gray-600;
    font-size: $font-size-lg;
  }
}

@keyframes gradient {
  to {
    background-position-x: -500px;
  }
}
</style>
