<script setup lang="ts">
const {
  error,
  direction = "column",
  type = "text",
} = defineProps<{
  label?: string;
  placeholder?: string;
  error?: string;
  direction?: "row" | "column";
  type?: "text" | "password";
}>();

const model = defineModel<string>({ default: "" });
</script>

<template>
  <div class="input-app">
    <div :class="['block', `-${direction}`]">
      <label v-if="label" class="label">{{ label }}:</label>
      <div class="wrapper">
        <input
          v-model="model"
          :type="type"
          class="input"
          :placeholder="placeholder"
        />
        <fa-icon
          v-if="model"
          icon="xmark"
          class="icon -clear"
          @click="model = ''"
        />
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.input-app {
  display: flex;
  flex-direction: column;
  gap: 5px;
  > .error {
    font-size: $font-size-sm;
    color: $red;
  }
}

.input-app > .block {
  display: flex;
  &.-row {
    flex-direction: row;
    align-items: center;
    gap: 5px;
  }
  &.-column {
    flex-direction: column;
    gap: 8px;
  }
  > .label {
    font-size: $font-size-md;
    font-weight: 600;
    color: material-color(grey, 900);
  }
  > .wrapper {
    flex-grow: 1;
    position: relative;
  }
  > .wrapper > .input {
    width: 100%;
    padding: 10px 25px 10px 12px;
    border-radius: $radius-sm;
    border: 2px solid $color-border;
    background-color: $white;
    outline: none;
    transition: $time-fast;
    &:focus {
      border-color: material-color(blue, 200);
    }
  }
  > .wrapper > .icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: $red;
    cursor: pointer;
  }
}
</style>
