import { createRouter, createWebHistory } from "vue-router";
import {
  createNnnModules,
  createNnnRoutes,
  createNnnScrollBehavior,
} from "vue-nnn-router";

const createNnnRouter = () => {
  const lazyViews = import.meta.glob(
    "/views/vue-public/pages/**/*.{vue,tsx,jsx}"
  );
  const eagerSidecars = import.meta.glob(
    [
      "/views/vue-public/pages/**/_middleware.ts",
      "/views/vue-public/pages/**/_redirect.ts",
    ],
    { eager: true }
  );

  const modules = createNnnModules({
    views: lazyViews as Record<string, unknown>,
    eager: eagerSidecars as Record<string, unknown>,
  });

  const routes = createNnnRoutes(modules, {
    routesRoot: "views/vue-public/pages",
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
