import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

import { useAuth } from "@fe-admin/composables/auth";

import { ROUTER_NAME } from "@fe-admin/constants/router-name";

export default async function adminMiddleware(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const { isLoggedIn, user, getProfile, logout } = useAuth();

  if (to.name === ROUTER_NAME.adminLogin) return next();

  if (!isLoggedIn.value) {
    return next({ name: ROUTER_NAME.adminLogin });
  }

  await getProfile();
  if (!isLoggedIn.value || (user.value.id && user.value.type !== "admin")) {
    await logout();
    return next({ name: ROUTER_NAME.adminLogin });
  }

  next();
}
