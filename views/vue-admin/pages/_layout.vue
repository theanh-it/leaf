<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import AdminLayout from "@fe-admin/layouts/admin/index.vue";

import { ROUTER_NAME } from "@fe-admin/constants/router-name";

const route = useRoute();
const isLoginPage = computed(() => route.name === ROUTER_NAME.adminLogin);
</script>

<template>
  <RouterView v-if="isLoginPage" />
  <AdminLayout v-else />
</template>
