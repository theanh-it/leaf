<script setup lang="ts">
import { computed, ref } from "vue";

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

const { goToBack } = useAppRouter();
const { isLoading, showLoading, hiddenLoading } = useLoading();
const { notifySuccess, notifyError } = useNotification();

const form = ref(createEmptyUserForm());

const rules = computed(() => ({
  username: {
    ...requiredRule("tên đăng nhập"),
    ...fieldRule({ name: "tên đăng nhập", minLength: 3 }),
  },
  password: {
    ...requiredRule("mật khẩu"),
    ...fieldRule({ name: "mật khẩu", minLength: 6 }),
  },
  confirmPassword: {
    ...requiredRule("xác nhận mật khẩu"),
    ...sameAsRule({
      name: "xác nhận mật khẩu",
      value: form.value.password,
    }),
  },
  type: requiredRule("loại tài khoản"),
  status: requiredRule("trạng thái"),
}));

const { v$, errors, setApiErrors } = useValidate(form, rules);

const handleReset = () => {
  form.value = createEmptyUserForm();
  v$.value.$reset();
};

const handleSubmit = async () => {
  const isValid = await v$.value.$validate();

  if (!isValid) return;

  try {
    showLoading();
    await usersApi.create(form.value);
    notifySuccess("Tạo người dùng thành công");
    goToBack();
  } catch (error: any) {
    if (error?.result) {
      setApiErrors(error.result);
      return;
    }

    notifyError("Tạo người dùng thất bại");
  } finally {
    hiddenLoading();
  }
};
</script>

<template>
  <AdminPage
    title="Thêm người dùng"
    :breadcrumbs="[
      { label: 'Trang chủ', to: '/admin' },
      { label: 'Người dùng', to: '/admin/users' },
      { label: 'Thêm mới' },
    ]"
  >
    <FormCard
      title="Thêm người dùng"
      :loading="isLoading"
      @back="goToBack"
      @reset="handleReset"
      @submit="handleSubmit"
    >
      <UserFormFields v-model="form" :errors="errors" />
    </FormCard>
  </AdminPage>
</template>
