<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from "vue";
import { storeToRefs } from "pinia";

import ConfirmContainer from "@fe-components/confirm/confirm-container.vue";
import LoadingApp from "@fe-components/loading/app.vue";

import { useAppStore } from "@fe-stores/app";
import { useAuthStore } from "@fe-stores/auth";

const appStore = useAppStore();
const authStore = useAuthStore();

const { isLoadingApp } = storeToRefs(appStore);

const isReady = ref(false);

onMounted(() => {
  authStore.getProfile().finally(() => {
    isReady.value = true;
    appStore.hiddenLoadingApp();
  });
});
</script>

<template>
  <LoadingApp v-if="isLoadingApp" />
  <ConfirmContainer />
  <Notifications class="notifications" />
  <RouterView v-if="isReady" />
</template>

<style scoped lang="scss">
.notifications {
  margin-top: $space-sm;
  z-index: $z-index-notifications;
}
</style>
