<script setup lang="ts">
import { computed, reactive, onMounted, watch } from "vue";

import Logo from "@fe-admin/components/logo/admin.vue";

import { useAppRouter } from "@fe-admin/composables/router";
import { useAuth } from "@fe-admin/composables/auth";

import { ADMIN_BRAND } from "@fe-admin/constants/app";
import { ROUTER_NAME } from "@fe-admin/constants/router-name";

const { route, goToLogin } = useAppRouter();
const { user, logout } = useAuth();

const displayName = computed(
  () => user.value.fullname || user.value.username || "Admin"
);

const displayRole = computed(() => {
  return "Quản trị viên";
});

const handleLogout = async () => {
  await logout();
  goToLogin();
};

const groupExpanded = reactive({
  shop: false,
  forum: false,
});

const toggleGroup = (group: keyof typeof groupExpanded) => {
  groupExpanded[group] = !groupExpanded[group];
};

const syncGroupFromRoute = () => {
  const p = route.path;
  if (
    p.includes("/admin/shop/categories") ||
    p.includes("/admin/shop/products") ||
    p.includes("/admin/shop/orders")
  ) {
    groupExpanded.shop = true;
  }
  if (
    p.includes("/admin/forum/categories") ||
    p.includes("/admin/forum/posts")
  ) {
    groupExpanded.forum = true;
  }
};

watch(
  () => route.path,
  () => syncGroupFromRoute()
);

onMounted(() => syncGroupFromRoute());
</script>

<template>
  <div class="left-bar-default">
    <div class="header">
      <Logo
        :name="ADMIN_BRAND.name"
        :text="ADMIN_BRAND.text"
        :icon="ADMIN_BRAND.icon"
        color="#ffffff"
        size="sm"
        position="left"
        theme="dark"
      />
      <p class="tagline">{{ ADMIN_BRAND.taglineShort }}</p>
    </div>

    <nav class="nav" aria-label="Menu điều hướng">
      <p class="nav-label">Menu chính</p>
      <div class="content">
        <RouterLink
          :to="{ name: ROUTER_NAME.adminDashboard }"
          class="item nav-item"
          active-class="-active"
        >
          <span class="item-icon">
            <fa-icon icon="house" />
          </span>
          <span class="label">Bảng điều khiển</span>
        </RouterLink>
        <RouterLink
          :to="{ name: ROUTER_NAME.adminUsers }"
          class="item nav-item"
          active-class="-active"
        >
          <span class="item-icon">
            <fa-icon icon="users" />
          </span>
          <span class="label">Người dùng</span>
        </RouterLink>
        <animateTransform class="item nav-item" active-class="-active">
          <span class="item-icon">
            <fa-icon icon="credit-card" />
          </span>
          <span class="label">TK nhận tiền</span>
        </animateTransform>
      </div>
    </nav>

    <div class="footer">
      <div class="user-card">
        <div class="avatar">
          <fa-icon icon="user" />
        </div>
        <div class="user-info">
          <p class="name">{{ displayName }}</p>
          <p class="role">{{ displayRole }}</p>
        </div>
      </div>

      <button class="logout-btn" @click="handleLogout">
        <fa-icon icon="arrow-right-to-bracket" />
        <span>Đăng xuất</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.left-bar-default {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    material-color(blue, 900) 0%,
    material-color(blue, 800) 42%,
    material-color(teal, 900) 100%
  );
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
}

.header {
  padding: $space-md $space;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 82px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
}

.tagline {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 0.02em;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: $space-sm 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.nav::-webkit-scrollbar {
  display: none;
}

.nav-label {
  display: none;
}

.content {
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  text-decoration: none;
  color: inherit;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: $radius-md;
  cursor: pointer;
  transition:
    background-color $time-fast,
    box-shadow $time-fast,
    color $time-fast;
  color: rgba(255, 255, 255, 0.88);

  &:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  &.-active {
    background: rgba(255, 255, 255, 0.12);
    box-shadow: inset 3px 0 0 material-color(cyan, 300);
    color: $white;

    .item-icon {
      background: rgba(255, 255, 255, 0.18);
      color: material-color(cyan, 100);
    }
  }
}

.group-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-parent {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
}

.sub-menu {
  margin: -2px 0 2px 18px;
  padding-left: 12px;
  border-left: 1px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.submenu-enter-active,
.submenu-leave-active {
  transition:
    max-height 0.24s ease,
    opacity 0.2s ease,
    transform 0.2s ease,
    margin 0.2s ease,
    padding 0.2s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-4px);
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  max-height: 240px;
  opacity: 1;
  transform: translateY(0);
}

.expand-icon {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.72);
  transition: transform $time-fast;

  &.-open {
    transform: rotate(90deg);
  }
}

.item-child {
  padding: 8px 10px;
  color: rgba(255, 255, 255, 0.78);

  &:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  .item-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: $font-size-sm;
  }

  .label {
    font-size: $font-size-sm;
    font-weight: 600;
  }
}

.item-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.08);
  font-size: $font-size-md;
  color: rgba(255, 255, 255, 0.92);
  transition: background-color $time-fast;
}

.label {
  font-size: $font-size-md;
  font-weight: 600;
  line-height: 1.3;
}

.footer {
  margin-top: auto;
  padding: $space;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  color: material-color(cyan, 100);
}

.user-info {
  min-width: 0;
}

.name,
.role {
  margin: 0;
}

.name {
  color: rgba(255, 255, 255, 0.95);
  font-size: $font-size-md;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.7);
  font-size: $font-size-sm;
}

.logout-btn {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  padding: 9px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  cursor: pointer;
  transition: $time-fast;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }
}
</style>
