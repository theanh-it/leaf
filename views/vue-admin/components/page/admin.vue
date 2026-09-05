<script setup lang="ts">
import { watch } from "vue";

import { usePageInfo } from "@fe-admin/composables/page";

const props = defineProps<{
  title: string;
  breadcrumbs: {
    label: string;
    to?: string | { name: string };
  }[];
}>();

const { setPageInfo } = usePageInfo();

watch(
  () => [props.title, props.breadcrumbs] as const,
  () => setPageInfo(props.title, props.breadcrumbs),
  { immediate: true, deep: true }
);
</script>

<template>
  <div class="admin-page">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.admin-page {
  padding: $space;
}
</style>
