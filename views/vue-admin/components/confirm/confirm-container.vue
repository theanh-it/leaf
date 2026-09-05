<script setup lang="ts">
import { useConfirm } from "@fe-admin/composables/confirm";
import ConfirmDefault from "./default.vue";

const { isOpen, currentOptions, onConfirm, onCancel } = useConfirm();
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-zoom-out">
      <component
        v-if="isOpen"
        :is="currentOptions.component || ConfirmDefault"
        :options="currentOptions"
        @confirm="onConfirm"
        @cancel="onCancel"
      />
    </Transition>
  </Teleport>
</template>
