import { createRouter, createWebHistory } from "vue-router";
import {
  createNnnRoutes,
  createNnnModules,
  createNnnScrollBehavior,
} from "vue-nnn-router";

const isDev = import.meta.env.DEV;

const createRouterProduction = () => {
  const lazyViews = import.meta.glob("/views/vue/pages/**/*.{vue,tsx,jsx}");
  const eagerSidecars = import.meta.glob(
    ["/views/vue/pages/**/_middleware.ts", "/views/vue/pages/**/_redirect.ts"],
    { eager: true }
  );

  const modules = createNnnModules({
    views: lazyViews as Record<string, unknown>,
    eager: eagerSidecars as Record<string, unknown>,
  });

  const routes = createNnnRoutes(modules, {
    routesRoot: "views/vue/pages",
    verbose: import.meta.env.DEV,
    silent: false,
  });

  return createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: createNnnScrollBehavior({ smooth: true }),
  });
};

const createRouterDevelopment = () => {
  const modules = import.meta.glob(
    [
      "/views/vue/pages/**/*.{vue,tsx,jsx,ts,js}",
      "/views/vue/pages/**/_middleware.ts",
    ],
    { eager: true }
  );

  const routes = createNnnRoutes(modules as Record<string, unknown>, {
    routesRoot: "/views/vue/pages",
    verbose: import.meta.env.DEV,
    silent: false,
  });

  return createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: createNnnScrollBehavior({ smooth: true }),
  });
};

export const router = isDev
  ? createRouterDevelopment()
  : createRouterProduction();
