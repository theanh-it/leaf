<script setup lang="ts">
import ButtonApp from "@fe-admin/components/app/button.vue";
import LoadingApp from "@fe-admin/components/loading/loading.vue";

defineProps<{
  loading?: boolean;
  title?: string;
  /** Ẩn nút Thêm mới (vd. trang chỉ xem danh sách) */
  showAdd?: boolean;
}>();

const emit = defineEmits<{
  (e: "add"): void;
}>();

const handleAdd = () => emit("add");
</script>

<template>
  <div class="admin-card">
    <LoadingApp v-if="loading" position="absolute" />
    <div class="header">
      <h3 class="title">{{ title }}</h3>
      <div v-if="showAdd !== false" class="actions">
        <ButtonApp
          size="sm"
          color="success"
          icon="plus"
          label="Thêm mới"
          @click="handleAdd"
        />
      </div>
    </div>
    <div v-if="$slots.toolbar" class="toolbar">
      <slot name="toolbar" />
    </div>
    <div class="table">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-card {
  width: 100%;
  background: $white;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.admin-card > .header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-sm $space-md;
  > .title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-text;
  }
  > .actions {
    display: flex;
    align-items: center;
    gap: $space-md;
  }
  > .actions > .item {
    display: flex;
    align-items: center;
    gap: $space-xs;
    padding: $space-xs $space-sm;
    border-radius: $radius-sm;
    background: $color-bg-subtle;
    cursor: pointer;
    &:hover {
      color: $color-primary;
    }
  }
}
</style>
