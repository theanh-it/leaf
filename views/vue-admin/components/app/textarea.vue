<script setup lang="ts">
defineProps<{
  label?: string;
  placeholder?: string;
  error?: string;
}>();

const model = defineModel<string>({ default: "" });
</script>

<template>
  <div class="admin-textarea">
    <label v-if="label" class="label">{{ label }}:</label>
    <textarea
      v-model="model"
      :placeholder="placeholder"
      class="textarea"
      rows="3"
    />
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.admin-textarea {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  > .label {
    font-size: $font-size-md;
    font-weight: $font-weight-bold;
    color: $color-text;
  }
  > .textarea {
    padding: $space-sm $space-md;
    border: 2px solid $color-border;
    border-radius: $radius-sm;
    font-size: $font-size-md;
    font-family: $font-family;
    resize: vertical;
    min-height: 80px;
  }
  > .textarea:focus {
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
