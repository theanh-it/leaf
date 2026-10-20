<script setup lang="ts">
import { onMounted, ref } from "vue";

import AdminPage from "@fe-admin/components/page/admin.vue";
import AdminCard from "@fe-admin/components/app/admin-card.vue";
import TableApp from "@fe-admin/components/app/table.vue";
import ColApp from "@fe-admin/components/app/table/col.vue";
import ColAction from "@fe-admin/components/app/table/col-action.vue";
import ButtonApp from "@fe-admin/components/app/button.vue";
import PaginateApp from "@fe-admin/components/app/paginate.vue";

import { useConfirm } from "@fe-admin/composables/confirm";
import { useNotification } from "@fe-admin/composables/notification";
import { useAppRouter } from "@fe-admin/composables/router";

import { usersApi } from "@fe-admin/apis/users";

import { API_ERROR_MESSAGE } from "@fe-admin/constants/api-message";
import {
  getUserStatusLabel,
  getUserTypeLabel,
  USER_STATUS_OPTIONS,
  USER_TYPE_OPTIONS,
} from "@fe-admin/constants/user";

import type { User } from "@fe-admin/types/user";

const { goToAddUser, goToEditUser } = useAppRouter();
const { openConfirm } = useConfirm();
const { notifySuccess, notifyError } = useNotification();

const isLoading = ref(true);
const users = ref<User[]>([]);
const filters = ref({ search: "", type: "", status: "" });
const pagination = ref({ page: 1, limit: 20, totalRecords: 0, totalPages: 1 });
let latestRequest = 0;

const headers = [
  "Tên đăng nhập",
  "Họ tên",
  "Email",
  "Loại",
  "Trạng thái",
  "Ngày tạo",
  "Thao tác",
];

const fetchUsers = async (page = pagination.value.page) => {
  const request = ++latestRequest;
  isLoading.value = true;

  try {
    const response = await usersApi.list({
      page,
      limit: pagination.value.limit,
      search: filters.value.search,
      ...(filters.value.type ? { type: filters.value.type } : {}),
      ...(filters.value.status ? { status: filters.value.status } : {}),
    });
    if (request !== latestRequest) return;
    users.value = response.result.items;
    pagination.value = response.result.pagination;
  } catch {
    if (request === latestRequest)
      notifyError("Không thể tải danh sách người dùng");
  } finally {
    if (request === latestRequest) isLoading.value = false;
  }
};

const getErrorMessage = (error: any) => {
  const result = error?.result;

  if (result && typeof result === "object") {
    const code = Object.values(result)[0];

    if (typeof code === "string") {
      return API_ERROR_MESSAGE[code] || code;
    }
  }

  return error?.message || "Có lỗi xảy ra";
};

const handleDelete = async (user: User) => {
  const confirmed = await openConfirm({
    title: "Xóa người dùng",
    message: `Bạn có chắc muốn xóa "${user.username}"?`,
    confirmText: "Xóa",
  });

  if (!confirmed) return;

  try {
    await usersApi.remove(user.id);
    notifySuccess("Xóa người dùng thành công");
    await fetchUsers();
  } catch (error: any) {
    notifyError(getErrorMessage(error));
  }
};

onMounted(() => fetchUsers());
</script>

<template>
  <AdminPage
    :loading="isLoading"
    title="Người dùng"
    :breadcrumbs="[
      { label: 'Trang chủ', to: '/admin' },
      { label: 'Người dùng' },
    ]"
  >
    <AdminCard
      show-add
      :loading="isLoading"
      title="Danh sách người dùng"
      @add="goToAddUser"
    >
      <template #toolbar>
        <form class="user-filters" @submit.prevent="fetchUsers(1)">
          <input
            v-model="filters.search"
            class="field"
            type="search"
            maxlength="255"
            aria-label="Tìm người dùng"
            placeholder="Tên, email hoặc số điện thoại"
          />
          <select
            v-model="filters.type"
            class="field"
            aria-label="Loại người dùng"
          >
            <option value="">Tất cả loại tài khoản</option>
            <option
              v-for="option in USER_TYPE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <select
            v-model="filters.status"
            class="field"
            aria-label="Trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option
              v-for="option in USER_STATUS_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <button class="action" type="submit" :disabled="isLoading">
            Tìm kiếm
          </button>
        </form>
      </template>
      <TableApp :headers="headers" :rows="users" hidden-border hidden-radius>
        <template #row="{ row }">
          <ColApp :value="row.username" />
          <ColApp :value="row.fullname || '—'" />
          <ColApp :value="row.email || '—'" />
          <ColApp :value="getUserTypeLabel(row.type)" />
          <ColApp :value="getUserStatusLabel(row.status)" />
          <ColApp type="date" :value="row.createdAt" />
          <ColAction wrap>
            <ButtonApp
              size="sm"
              color="primary"
              icon="pen"
              label="Sửa"
              @click="goToEditUser(row.id)"
            />
            <ButtonApp
              size="sm"
              color="danger"
              icon="trash"
              label="Xóa"
              @click="handleDelete(row)"
            />
          </ColAction>
        </template>
      </TableApp>
      <PaginateApp v-bind="pagination" @run-page="fetchUsers" />
    </AdminCard>
  </AdminPage>
</template>

<style scoped lang="scss">
.user-filters {
  display: flex;
  flex-wrap: wrap;
  gap: $space-sm;
  padding: $space-sm $space-md;

  > .field {
    min-width: 0;
    flex: 1 1 180px;
    padding: $space-sm;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $white;
  }

  > .action {
    padding: $space-sm $space-md;
    border: 0;
    border-radius: $radius-sm;
    background: $color-primary;
    color: $white;
    cursor: pointer;
  }
}
</style>
