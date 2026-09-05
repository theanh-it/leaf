<script setup lang="ts">
import HeaderDefault from "@fe-admin/layouts/admin/header.vue";
import LeftBarDefault from "@fe-admin/layouts/admin/left-bar.vue";
</script>

<template>
  <div class="layout-default">
    <left-bar-default class="left-bar" />
    <div class="layout-content">
      <HeaderDefault class="header" />
      <div class="page-root">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout-default {
  display: flex;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #f4fbff 0%, #f8fbff 100%);
  > .left-bar {
    width: 280px;
    height: 100%;
    flex-shrink: 0;
  }
  > .layout-content {
    flex-grow: 1;
    overflow: hidden;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .page-root {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
