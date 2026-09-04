import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

import { useAuth } from "@fe-admin/composables/auth";

import { ROUTER_NAME } from "@fe-admin/constants/router-name";

/**
 * Middleware gốc: chạy trước mọi route dưới pages/.
 */
export default function rootMiddleware(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const { isLoggedIn } = useAuth();

  console.log("MD isLoggedIn", isLoggedIn.value);

  if (import.meta.env.DEV) {
    console.log("[demo root _middleware]", to.fullPath);
  }

  if (!isLoggedIn.value) {
    return next({ name: ROUTER_NAME.adminLogin });
  }

  next();
}
