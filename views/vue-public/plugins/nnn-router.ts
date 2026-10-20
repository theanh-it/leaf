import { createRouter, createWebHistory } from "vue-router";
import { createNnnRoutes, createNnnScrollBehavior } from "vue-nnn-router";

const routes = createNnnRoutes("views/vue-public/pages", {
  verbose: import.meta.env.DEV,
  silent: false,
});

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: createNnnScrollBehavior({ smooth: true }),
});
