<script setup lang="ts">
import InputApp from "@fe-admin/components/app/input.vue";
import SelectApp from "@fe-admin/components/app/select.vue";
import GroupApp from "@fe-admin/components/app/group.vue";
import TextareaApp from "@fe-admin/components/app/textarea.vue";

import {
  USER_STATUS_OPTIONS,
  USER_TYPE_OPTIONS,
  type UserForm,
} from "@fe-admin/constants/user";

defineProps<{
  errors: Record<string, string>;
  isEdit?: boolean;
}>();

const form = defineModel<UserForm>({ required: true });
</script>

<template>
  <GroupApp direction="column" gap="16">
    <GroupApp wrap>
      <InputApp
        v-model="form.username"
        label="Tên đăng nhập"
        placeholder="Nhập tên đăng nhập"
        :error="errors.username"
      />
      <InputApp
        v-model="form.fullname"
        label="Họ tên"
        placeholder="Nhập họ tên"
        :error="errors.fullname"
      />
    </GroupApp>

    <GroupApp wrap>
      <InputApp
        v-model="form.password"
        label="Mật khẩu"
        type="password"
        :placeholder="isEdit ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'"
        :error="errors.password"
      />
      <InputApp
        v-model="form.confirmPassword"
        label="Xác nhận mật khẩu"
        type="password"
        placeholder="Nhập lại mật khẩu"
        :error="errors.confirmPassword"
      />
    </GroupApp>

    <GroupApp wrap>
      <InputApp
        v-model="form.email"
        label="Email"
        placeholder="Nhập email"
        :error="errors.email"
      />
      <InputApp
        v-model="form.phone"
        label="Số điện thoại"
        placeholder="Nhập số điện thoại"
        :error="errors.phone"
      />
    </GroupApp>

    <GroupApp wrap>
      <SelectApp
        v-model="form.type"
        label="Loại tài khoản"
        :options="USER_TYPE_OPTIONS"
        hidden-all
        :error="errors.type"
      />
      <SelectApp
        v-model="form.status"
        label="Trạng thái"
        :options="USER_STATUS_OPTIONS"
        hidden-all
        :error="errors.status"
      />
    </GroupApp>

    <TextareaApp
      v-model="form.address"
      label="Địa chỉ"
      placeholder="Nhập địa chỉ"
      :error="errors.address"
    />
  </GroupApp>
</template>
