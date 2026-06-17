<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import AdminPage from "@fe-components/page/admin.vue";
import FormCard from "@fe-components/app/form-card.vue";
import UserFormFields from "@fe-components/user/form-fields.vue";

import { usersApi } from "@fe-apis/users";
import { createEmptyUserForm } from "@fe-constants/user";

import { fieldRule, requiredRule, sameAsRule } from "@fe-helpers/validate-rule";
import { useLoading } from "@fe-composables/loading";
import { useNotification } from "@fe-composables/notification";
import { useAppRouter } from "@fe-composables/router";
import { useValidate } from "@fe-composables/validate";

const { route, goToBack } = useAppRouter();
const { isLoading, showLoading, hiddenLoading } = useLoading();
const { notifySuccess, notifyError } = useNotification();

const userId = computed(() => String(route.params.id || ""));
const form = ref(createEmptyUserForm());

const rules = computed(() => {
  const base = {
    username: {
      ...requiredRule("tên đăng nhập"),
      ...fieldRule({ name: "tên đăng nhập", minLength: 3 }),
    },
    type: requiredRule("loại tài khoản"),
    status: requiredRule("trạng thái"),
  };

  if (!form.value.password) return base;

  return {
    ...base,
    password: fieldRule({ name: "mật khẩu", minLength: 6 }),
    confirmPassword: sameAsRule({
      name: "xác nhận mật khẩu",
      value: form.value.password,
    }),
  };
});

const { v$, errors, setApiErrors } = useValidate(form, rules);

const fetchUser = async () => {
  if (!userId.value) {
    notifyError("Không tìm thấy người dùng");
    handleBack();
    return;
  }

  showLoading();

  try {
    const response = await usersApi.getById(userId.value);
    const user = response.result;

    form.value = {
      username: user.username,
      password: "",
      confirmPassword: "",
      fullname: user.fullname || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      type: user.type,
      status: user.status,
    };
  } catch {
    notifyError("Không thể tải thông tin người dùng");
    handleBack();
  } finally {
    hiddenLoading();
  }
};

const handleReset = async () => {
  await fetchUser();
  v$.value.$reset();
};

const handleSubmit = async () => {
  const isValid = await v$.value.$validate();

  if (!isValid) return;

  try {
    showLoading();
    await usersApi.update(userId.value, form.value);
    notifySuccess("Cập nhật người dùng thành công");
    goToBack();
  } catch (error: any) {
    if (error?.result) {
      setApiErrors(error.result);
      return;
    }

    notifyError("Cập nhật người dùng thất bại");
  } finally {
    hiddenLoading();
  }
};

onMounted(fetchUser);
</script>

<template>
  <AdminPage
    title="Cập nhật người dùng"
    :breadcrumbs="[
      { label: 'Trang chủ', to: '/admin' },
      { label: 'Người dùng', to: '/admin/users' },
      { label: 'Chỉnh sửa' },
    ]"
  >
    <FormCard
      title="Cập nhật người dùng"
      :loading="isLoading"
      @back="goToBack"
      @reset="handleReset"
      @submit="handleSubmit"
    >
      <UserFormFields v-model="form" :errors="errors" is-edit />
    </FormCard>
  </AdminPage>
</template>
