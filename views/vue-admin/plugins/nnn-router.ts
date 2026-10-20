import { createRouter, createWebHistory } from "vue-router";
import {
  createNnnRoutes,
  createNnnScrollBehavior,
  createNnnProgress,
} from "vue-nnn-router";

const routes = createNnnRoutes("views/vue-admin/pages", {
  prefix: "admin",
  verbose: import.meta.env.DEV,
  silent: false,
});

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: createNnnScrollBehavior({ smooth: true }),
});

createNnnProgress(router, {
  enabled: true,
  color: "red",
  height: 1,
  position: "top",
  delay: 0,
});
