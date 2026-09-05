import { createRouter, createWebHistory } from "vue-router";
import {
  createNnnRoutes,
  createNnnModules,
  createNnnScrollBehavior,
  createNnnProgress,
} from "vue-nnn-router";

const createNnnRouter = () => {
  const lazyViews = import.meta.glob(
    "/views/vue-admin/pages/**/*.{vue,tsx,jsx}"
  );

  const eagerSidecars = import.meta.glob(
    [
      "/views/vue-admin/pages/**/_middleware.ts",
      "/views/vue-admin/pages/**/_redirect.ts",
    ],
    { eager: true }
  );

  const modules = createNnnModules({
    views: lazyViews as Record<string, unknown>,
    eager: eagerSidecars as Record<string, unknown>,
  });

  const routes = createNnnRoutes(modules, {
    routesRoot: "views/vue-admin/pages",
    prefix: "/admin",
    verbose: import.meta.env.DEV,
    silent: false,
  });

  return createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: createNnnScrollBehavior({ smooth: true }),
  });
};

export const router = createNnnRouter();

createNnnProgress(router, {
  enabled: true,
  color: "red",
  height: 1,
  position: "top",
  delay: 0,
});
