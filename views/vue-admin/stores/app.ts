import { ref } from "vue";
import { defineStore } from "pinia";

import { useAuthStore } from "@fe-admin/stores/auth";

export const useAppStore = defineStore("app", () => {
  const authStore = useAuthStore();

  const isLoadingApp = ref(true);
  const showLoadingApp = () => (isLoadingApp.value = true);
  const hiddenLoadingApp = () => (isLoadingApp.value = false);

  const initApp = async () => {
    await authStore.getProfile();
  };

  return {
    initApp,
    isLoadingApp,
    showLoadingApp,
    hiddenLoadingApp,
  };
});
