<script setup lang="ts"></script>

<template>
  <div class="page-app">
    <router-link to="/">Home</router-link>
    <h1>About</h1>
    <p>This is the about page</p>
  </div>
</template>

<style lang="scss" scoped>
.page-app {
  display: flex;
  flex-direction: column;
  padding: 20px;
  > h1 {
    color: red;
  }
}
</style>
