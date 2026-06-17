<script setup lang="ts">
import { onMounted, ref } from "vue";

import AdminPage from "@fe-components/page/admin.vue";
import AdminCard from "@fe-components/app/admin-card.vue";
import TableApp from "@fe-components/app/table.vue";
import ColApp from "@fe-components/app/table/col.vue";
import ColAction from "@fe-components/app/table/col-action.vue";
import ButtonApp from "@fe-components/app/button.vue";

import { useConfirm } from "@fe-composables/confirm";
import { useNotification } from "@fe-composables/notification";
import { useAppRouter } from "@fe-composables/router";

import { usersApi } from "@fe-apis/users";

import { API_ERROR_MESSAGE } from "@fe-constants/api-message";
import { getUserStatusLabel, getUserTypeLabel } from "@fe-constants/user";

import type { User } from "@fe-types/user";

const { goToAddUser, goToEditUser } = useAppRouter();
const { openConfirm } = useConfirm();
const { notifySuccess, notifyError } = useNotification();

const isLoading = ref(true);
const users = ref<User[]>([]);

const headers = [
  "Tên đăng nhập",
  "Họ tên",
  "Email",
  "Loại",
  "Trạng thái",
  "Ngày tạo",
  "Thao tác",
];

const fetchUsers = async () => {
  isLoading.value = true;

  try {
    const response = await usersApi.list();
    users.value = response.result || [];
  } catch {
    notifyError("Không thể tải danh sách người dùng");
  } finally {
    isLoading.value = false;
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

onMounted(fetchUsers);
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
    </AdminCard>
  </AdminPage>
</template>
