<script setup lang="ts">
import ButtonApp from "@fe-components/app/button.vue";

const { options } = defineProps<{
  options: any;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const onConfirm = () => emit("confirm");
const onCancel = () => emit("cancel");
</script>

<template>
  <div class="confirm-modal">
    <div class="container">
      <div class="header">
        <h2 class="title">{{ options.title }}</h2>
      </div>
      <div class="body">
        <p class="message">{{ options.message }}</p>
      </div>
      <div class="footer">
        <ButtonApp
          size="sm"
          color="danger"
          icon="xmark"
          :label="options.cancelText"
          class="btn -cancel"
          @click="onCancel"
        />
        <ButtonApp
          size="sm"
          color="primary"
          icon="check"
          :label="options.confirmText"
          class="btn -confirm"
          @click="onConfirm"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99999;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $space-lg;
  > .container {
    width: 100%;
    max-width: 400px;
    background-color: $white;
    padding: 20px;
    border-radius: $radius-md;
  }
  > .container > .header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: $space-sm;
  }
  > .container > .header > .title {
    font-size: 18px;
  }
  > .container > .body {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  > .container > .body > .message {
    font-size: 14px;
  }
  > .container > .footer {
    margin-top: $space-md;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
  }
  > .container > .footer > .btn {
    width: 100%;
    max-width: 108px;
  }
}
</style>
