import { ref, computed } from "vue";
import { defineStore } from "pinia";

import { authApi } from "@fe-apis/auth";
import { meApi } from "@fe-apis/me";

import type { User } from "@fe-types/user";

type LoginBody = {
  username: string;
  password: string;
};

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const getToken = () => {
    const result = localStorage.getItem("token");

    token.value = result;

    return result;
  };

  const user = ref<User>({} as User);
  const setUser = (data: User) => (user.value = data);
  const getUser = async () => {
    const result = getToken();

    if (!result) return {} as User;

    if (!user.value.id || !user.value.type) {
      await getProfile();
    }

    return user.value;
  };
  const getUserId = () => localStorage.getItem("userId");

  const isLoggedIn = computed(() => !!token.value);

  const login = async (data: LoginBody) => {
    const response = await authApi.login(data);

    localStorage.setItem("token", response.result.token);
    localStorage.setItem("userId", response.result.user.id);

    token.value = response.result.token;
    await getProfile();
  };

  const logout = async () => {
    token.value = null;
    user.value = {} as User;

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
  };

  const getProfile = async () => {
    try {
      const token = getToken();

      if (!token) {
        return logout();
      }

      const response = await meApi.getProfile();

      user.value = response.result;
    } catch (error) {
      console.error(error);
      return logout();
    }
  };

  return {
    token,
    getToken,
    isLoggedIn,
    user,
    setUser,
    getUser,
    getUserId,
    login,
    logout,
    getProfile,
  };
});
