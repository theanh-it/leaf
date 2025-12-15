<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <div class="app">
    <h1 class="title">Leaf App</h1>
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

  .title {
    background-image: url("https://www.industrialempathy.com/img/remote/ZiClJf-1920w.jpg");
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
