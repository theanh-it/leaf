<script setup lang="ts">
import { computed } from "vue";

const {
  label,
  items = [],
  error,
  labelKey = "label",
  valueKey = "value",
} = defineProps<{
  label?: string;
  items?: any[];
  error?: string;
  labelKey?: string;
  valueKey?: string;
}>();

const emit = defineEmits<{
  remove: [value: string];
  add: [value: string];
}>();

const model = defineModel<any[]>({ default: [] });

const options = computed(() => {
  return items.map((item) => ({
    label: item[labelKey],
    value: item[valueKey],
  }));
});

const checkedItems = computed(() => {
  return model.value.reduce((acc: any[], item: any) => {
    acc[item] = true;

    return acc;
  }, {});
});

const toggleItem = (value: string) => {
  const i = model.value.indexOf(value);

  if (i === -1) {
    model.value.push(value);
    emit("add", value);
  } else {
    model.value.splice(i, 1);
    emit("remove", value);
  }
};
</script>

<template>
  <div class="admin-checkbox">
    <label v-if="label" class="label">{{ label }}:</label>
    <div class="items">
      <div
        v-for="item in options"
        :key="item.value"
        class="item"
        :class="{ '-checked': checkedItems[item.value] }"
        @click="toggleItem(item.value)"
      >
        <fa-icon
          v-if="checkedItems[item.value]"
          :icon="['far', 'square-check']"
          style="font-size: 24px"
          class="icon"
        />
        <fa-icon
          v-else
          :icon="['far', 'square']"
          style="font-size: 24px"
          class="icon"
        />
        <label class="label">
          {{ item.label }}
        </label>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.admin-checkbox {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  > .label {
    font-size: $font-size-md;
    font-weight: $font-weight-bold;
    color: $color-text;
  }
  > .items {
    min-height: 39px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: $space-md;
    border: 2px solid $color-border;
    border-radius: $radius-sm;
    padding: $space-xs;
  }
  > .items > .item {
    display: flex;
    align-items: center;
    gap: $space-xs;
    cursor: pointer !important;
  }
  > .items > .item > .icon {
    color: $color-text;
    cursor: pointer !important;
  }
  > .items > .item > .label {
    font-size: $font-size-md;
    font-weight: $font-weight-default;
    color: $color-text;
    cursor: pointer !important;
  }
  > .items > .item.-checked > .icon {
    color: $color-primary;
  }
  > .items > .item.-checked > .label {
    color: $color-primary;
  }
  > .error {
    font-size: $font-size-sm;
    font-weight: $font-weight-default;
    color: $color-error;
  }
}
</style>
