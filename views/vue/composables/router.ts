import { useRouter, useRoute } from "vue-router";

import { ROUTER_NAME } from "@fe-constants/router-name";

export const useAppRouter = () => {
  const router = useRouter();
  const route = useRoute();

  const goToBack = () => router.back();
  const goToName = (
    name: string,
    query?: Record<string, any>,
    params?: Record<string, any>
  ) => router.push({ name, query, params });
  const goToPath = (path: string, query?: Record<string, any>) =>
    router.push({ path, query });

  const goToHome = (query?: Record<string, any>) =>
    router.push({ name: ROUTER_NAME.home, query });
  const goToLogin = () => router.push({ name: ROUTER_NAME.login });
  const goToDashboard = () => router.push({ name: ROUTER_NAME.adminDashboard });

  const goToUsers = () => router.push({ name: ROUTER_NAME.adminUsers });
  const goToAddUser = () => router.push({ name: ROUTER_NAME.adminUsersAdd });
  const goToEditUser = (id: string) =>
    router.push({ name: ROUTER_NAME.adminUsersId, params: { id } });

  return {
    router,
    route,
    goToBack,
    goToName,
    goToPath,
    goToHome,
    goToLogin,
    goToDashboard,
    goToUsers,
    goToAddUser,
    goToEditUser,
  };
};
