<script setup lang="ts">
import AdminPage from "@fe-admin/components/page/admin.vue";
import AdminCard from "@fe-admin/components/app/admin-card.vue";
</script>

<template>
  <AdminPage
    title="Dashboard"
    :breadcrumbs="[
      { label: 'Trang chủ', to: '/admin' },
      { label: 'Dashboard' },
    ]"
  >
    <AdminCard title="Tổng quan" :show-add="false">
      <p class="welcome">Chào mừng bạn đến với hệ thống quản trị.</p>
    </AdminCard>
  </AdminPage>
</template>

<style scoped lang="scss">
.welcome {
  margin: 0;
  padding: $space-md;
  color: $color-text-muted;
  font-size: $font-size-md;
}
</style>
