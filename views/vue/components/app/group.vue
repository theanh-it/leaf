<script setup lang="ts">
const { direction = "row", gap = "20" } = defineProps<{
  direction?: "row" | "column";
  gap?: string;
  wrap?: boolean;
}>();
</script>

<template>
  <div
    :class="['admin-group', `-${direction}`, { '-wrap': wrap }]"
    :style="{ gap: `${gap}px` }"
  >
    <slot />
  </div>
</template>

<style scoped lang="scss">
.admin-group {
  width: 100%;
  height: max-content;
  display: flex;
  flex-direction: row;

  &.-column {
    flex-direction: column;
  }
  &.-row {
    flex-direction: row;
  }
  &.-wrap {
    flex-wrap: wrap;
  }
  > * {
    flex-grow: 1;
  }
}
</style>
