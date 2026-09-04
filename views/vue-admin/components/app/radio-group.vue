<script setup lang="ts">
export type AdminRadioOption = {
  value: string;
  label: string;
};

defineProps<{
  /** Thuộc tính name của nhóm radio (bắt buộc để nhóm độc lập) */
  name: string;
  options: AdminRadioOption[];
  /** aria-label cho radiogroup */
  ariaLabel?: string;
  disabled?: boolean;
}>();

const model = defineModel<string>({ default: "" });
</script>

<template>
  <div
    class="admin-radio-group"
    role="radiogroup"
    :aria-label="ariaLabel ?? name"
  >
    <label
      v-for="opt in options"
      :key="opt.value"
      class="radio-item"
      :class="{ '-checked': model === opt.value }"
    >
      <input
        v-model="model"
        type="radio"
        :name="name"
        :value="opt.value"
        class="radio-input"
        :disabled="disabled"
      />
      <span class="radio-text">{{ opt.label }}</span>
    </label>
  </div>
</template>

<style scoped lang="scss">
.admin-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.radio-item {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border: 2px solid $color-border;
  border-radius: $radius-md;
  background: $color-bg;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  user-select: none;

  &:hover {
    border-color: $color-primary;
  }

  &.-checked {
    border-color: $color-primary;
    background: $color-bg-subtle;
  }
}

.radio-input {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: $color-primary;
}

.radio-text {
  font-size: $font-size-base;
  color: $color-text;
}
</style>
