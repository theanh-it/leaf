import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@fe-pages/home.vue"),
    },
    {
      path: "/about",
      component: () => import("@fe-pages/about.vue"),
    },
  ],
});

export default router;
