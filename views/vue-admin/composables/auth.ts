import { storeToRefs } from "pinia";

import { useAuthStore } from "@fe-admin/stores/auth";

export const useAuth = () => {
  const authStore = useAuthStore();

  const { token, user, isLoggedIn } = storeToRefs(authStore);

  return {
    token,
    user,
    isLoggedIn,
    login: authStore.login,
    logout: authStore.logout,
    getProfile: authStore.getProfile,
  };
};
