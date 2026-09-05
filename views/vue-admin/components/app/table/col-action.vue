<script setup lang="ts">
const { wrap = false, gap = "8px" } = defineProps<{
  wrap?: boolean;
  gap?: string;
}>();
</script>

<template>
  <td>
    <div :class="['col-action', { '-wrap': wrap }]" :style="{ gap: gap }">
      <slot />
    </div>
  </td>
</template>

<style scoped lang="scss">
td {
  padding: $space-sm $space-md;
  border-bottom: 1px solid $color-border;
}
.col-action {
  display: flex;
  &.-wrap {
    flex-wrap: wrap;
  }
}
</style>
