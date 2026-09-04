<script setup lang="ts">
import LoadingApp from "@fe-admin/components/loading/loading.vue";
import ButtonApp from "@fe-admin/components/app/button.vue";

defineProps<{
  title?: string;
  loading?: boolean;
  hiddenBack?: boolean;
  hiddenReset?: boolean;
  hiddenFooter?: boolean;
}>();

const emit = defineEmits<{
  (e: "reset"): void;
  (e: "back"): void;
  (e: "submit"): void;
}>();

const handleReset = () => emit("reset");
const handleBack = () => emit("back");
const handleSubmit = () => emit("submit");
</script>

<template>
  <div class="admin-form-card">
    <LoadingApp v-if="loading" />
    <div class="header">
      <h3 class="title">
        <div v-if="!hiddenBack" class="back" @click="handleBack">
          <fa-icon icon="arrow-left" style="font-size: 20px" />
        </div>
        <span class="text">{{ title }}</span>
      </h3>
      <div class="actions">
        <ButtonApp
          v-if="!hiddenReset"
          size="sm"
          color="warning"
          icon="rotate"
          label="Làm mới"
          @click="handleReset"
        />
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
    <div v-if="!hiddenFooter" class="footer">
      <ButtonApp
        size="sm"
        color="danger"
        icon="xmark"
        label="Hủy"
        @click="handleBack"
      />
      <ButtonApp
        size="sm"
        color="primary"
        icon="floppy-disk"
        label="Lưu"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-form-card {
  width: 100%;
  background: $white;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  padding: $space-md;
  gap: $space-md;
  position: relative;
}

.admin-form-card > .header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  > .title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-text;
    display: flex;
    align-items: center;
    gap: $space-sm;
  }
  > .title > .back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: $radius-full;
    background: $color-bg-subtle;
    cursor: pointer;
    &:hover {
      color: $color-primary;
    }
    &:active {
      background: $color-bg-subtle;
    }
  }
  > .title > .text {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-text;
  }
  > .actions {
    display: flex;
    align-items: center;
    gap: $space-sm;
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
    &:active {
      background: $color-bg-subtle;
    }
  }
}

.admin-form-card > .content {
  display: flex;
  flex-direction: column;
}
.admin-form-card > .footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: $space-sm;
}
</style>
