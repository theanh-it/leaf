<script setup lang="ts">
import { numberFormat } from "@/utils";
import { computed } from "vue";

const { type = "text" } = defineProps<{
  label?: string;
  placeholder?: string;
  error?: string;
  type?: string;
  disabled?: boolean;
}>();

const model = defineModel<any>();
const formattedNumber = computed(() =>
  model.value ? numberFormat(model.value) : ""
);

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = target.value;

  if (value === "") {
    return;
  }
  // remove all non-numeric characters except . ,
  const numeric = value.replace(/[^0-9]/g, "");
  model.value = numeric ? Number(numeric) : "";
};
</script>

<template>
  <div class="admin-number-input">
    <label v-if="label" class="label">{{ label }}:</label>
    <input
      :value="formattedNumber"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input"
      @input="onInput"
    />
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.admin-number-input {
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  > .label {
    font-size: $font-size-md;
    font-weight: $font-weight-bold;
    color: $color-text;
  }
  > .input {
    padding: $space-sm $space-md;
    border: 2px solid $color-border;
    border-radius: $radius-sm;
    font-size: $font-size-md;
    font-family: $font-family;
  }
  > .input:focus {
    outline: none;
    border-color: material-color(blue, 200);
  }
  > .error {
    font-size: $font-size-sm;
    font-weight: $font-weight-default;
    color: $color-error;
  }
}
</style>
