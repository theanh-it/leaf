<script setup lang="ts">
import { computed, ref } from "vue";

import Logo from "@fe-components/logo/admin.vue";

import { useLoading } from "@fe-composables/loading";
import { useAppRouter } from "@fe-composables/router";
import { useNotification } from "@fe-composables/notification";
import { useValidate } from "@fe-composables/validate";
import { useAuth } from "@fe-composables/auth";

import { ADMIN_BRAND, LOGIN_BENEFITS } from "@fe-constants/app";
import { requiredRule } from "@fe-helpers/validate-rule";

const { isLoading, showLoading, hiddenLoading } = useLoading();
const { goToDashboard } = useAppRouter();
const { notifySuccess, notifyError } = useNotification();
const { login } = useAuth();

const rememberMe = ref(false);
const showPassword = ref(false);

const form = ref({
  username: "",
  password: "",
});
const rules = computed(() => ({
  username: requiredRule("tên đăng nhập"),
  password: requiredRule("mật khẩu"),
}));
const { v$, errors } = useValidate(form, rules);

const loginLabel = computed(() =>
  isLoading.value ? "Đang đăng nhập..." : "Đăng nhập"
);
const passwordInputType = computed(() =>
  showPassword.value ? "text" : "password"
);
const passwordToggleIcon = computed(() =>
  showPassword.value ? "eye-slash" : "eye"
);
const currentYear = new Date().getFullYear();

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  const isValid = await v$.value.$validate();

  if (!isValid) return;

  try {
    showLoading();
    await login(form.value);

    notifySuccess("Đăng nhập thành công!");
    goToDashboard();
  } catch (error: any) {
    console.error(error);

    notifyError("Đăng nhập thất bại. Vui lòng thử lại.");
  } finally {
    hiddenLoading();
  }
};
</script>

<template>
  <div class="login-page">
    <div class="decor -top"></div>
    <div class="decor -bottom"></div>

    <section class="login-card">
      <aside class="brand-panel">
        <div class="brand-content">
          <Logo
            :name="ADMIN_BRAND.name"
            :text="ADMIN_BRAND.text"
            :icon="ADMIN_BRAND.icon"
            color="#ffffff"
            size="lg"
            position="left"
            theme="dark"
          />

          <p class="brand-subtitle">{{ ADMIN_BRAND.tagline }}</p>

          <ul class="benefits">
            <li v-for="benefit in LOGIN_BENEFITS" :key="benefit">
              <span class="benefit-icon">
                <fa-icon icon="circle-check" />
              </span>
              <span>{{ benefit }}</span>
            </li>
          </ul>
        </div>

        <p class="copyright">
          © {{ currentYear }} {{ ADMIN_BRAND.copyright }}. All rights reserved.
        </p>
      </aside>

      <div class="form-panel">
        <h2 class="title">Đăng nhập</h2>
        <p class="subtitle">Chào mừng bạn đến với hệ thống quản trị website!</p>

        <form class="form" @submit.prevent="handleLogin">
          <label class="field">
            <span class="label">Tên đăng nhập</span>
            <div class="input-wrap">
              <fa-icon icon="user" class="input-icon" />
              <input
                v-model="form.username"
                class="input"
                type="text"
                placeholder="Tên đăng nhập"
                autocomplete="username"
              />
            </div>
            <span v-if="errors.username" class="error">
              {{ errors.username }}
            </span>
          </label>

          <label class="field">
            <span class="label">Mật khẩu</span>
            <div class="input-wrap">
              <fa-icon icon="lock" class="input-icon" />
              <input
                v-model="form.password"
                class="input"
                :type="passwordInputType"
                placeholder="Nhập mật khẩu"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-password"
                :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                @click="togglePassword"
              >
                <fa-icon :icon="passwordToggleIcon" class="input-icon -right" />
              </button>
            </div>
            <span v-if="errors.password" class="error">
              {{ errors.password }}
            </span>
          </label>

          <div class="form-meta">
            <label class="remember">
              <input v-model="rememberMe" type="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <button type="button" class="forgot">Quên mật khẩu?</button>
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <fa-icon icon="arrow-right-to-bracket" />
            <span>{{ loginLabel }}</span>
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-lg;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 12% 18%,
      rgba(22, 134, 217, 0.14),
      transparent 34%
    ),
    radial-gradient(
      circle at 88% 82%,
      rgba(46, 182, 176, 0.16),
      transparent 36%
    ),
    linear-gradient(160deg, #f4f9ff 0%, #f8fcff 48%, #eef6fb 100%);
}

.decor {
  position: absolute;
  border-radius: $radius-full;
  z-index: 1;
  filter: blur(2px);
}

.decor.-top {
  width: 320px;
  height: 320px;
  background: rgba(95, 173, 255, 0.16);
  top: -120px;
  right: -80px;
}

.decor.-bottom {
  width: 280px;
  height: 280px;
  background: rgba(100, 211, 190, 0.18);
  bottom: -110px;
  left: -80px;
}

.login-card {
  width: min(100%, 920px);
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  background: $white;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  overflow: hidden;
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.08),
    0 2px 8px rgba(15, 23, 42, 0.04);
}

.brand-panel {
  position: relative;
  background: linear-gradient(155deg, #0f6fb8 0%, #1686d9 42%, #1f9f9a 100%);
  padding: 40px 36px 28px;
  color: $white;
  display: flex;
  flex-direction: column;
  isolation: isolate;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        circle at 18% 12%,
        rgba(255, 255, 255, 0.18),
        transparent 42%
      ),
      radial-gradient(
        circle at 82% 88%,
        rgba(255, 255, 255, 0.1),
        transparent 38%
      );
    pointer-events: none;
    z-index: -1;
  }
}

.brand-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.brand-subtitle {
  margin: 20px 0 0;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.6;
  font-size: $font-size-md;
  max-width: 300px;
}

.benefits {
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.benefits li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.94);
  font-size: $font-size-sm;
  line-height: 1.5;
}

.benefit-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: $radius-full;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  font-size: 11px;
}

.copyright {
  margin-top: auto;
  padding-top: 28px;
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.65);
}

.form-panel {
  padding: 44px 44px 36px;
}

.title {
  margin: 0;
  color: #1f2937;
  font-size: 32px;
  line-height: 1.15;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: $font-size-md;
  line-height: 1.5;
}

.form {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: #374151;
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
}

.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  color: #7d8594;
  font-size: $font-size-md;
  pointer-events: none;
}

.input-icon.-right {
  left: auto;
  right: 12px;
}

.toggle-password {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;

  .input-icon {
    position: static;
    transform: none;
    pointer-events: none;
  }
}

.input {
  width: 100%;
  height: 46px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  padding: 0 40px 0 36px;
  font-size: $font-size-md;
  outline: none;
  transition: $time-fast;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    background: $white;
    border-color: #1686d9;
    box-shadow: 0 0 0 3px rgba(22, 134, 217, 0.12);
  }
}

.error {
  color: $red;
  font-size: $font-size-sm;
}

.form-meta {
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3c4350;
  font-weight: 600;
}

.forgot {
  border: none;
  background: transparent;
  color: #1d8bbf;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn {
  margin-top: 6px;
  border: none;
  width: 100%;
  height: 46px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1686d9 0%, #1f9f9a 100%);
  color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  cursor: pointer;
  transition: $time-fast;
  box-shadow: 0 10px 20px rgba(22, 134, 217, 0.22);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 14px 24px rgba(22, 134, 217, 0.28);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: none;
  }
}

@media (max-width: 980px) {
  .login-page {
    padding: $space-md;
  }

  .login-card {
    grid-template-columns: 1fr;
    width: min(100%, 560px);
  }

  .brand-panel,
  .form-panel {
    padding: 24px 20px;
  }

  .brand-subtitle {
    margin-top: 16px;
    font-size: $font-size-sm;
  }

  .benefits {
    margin-top: 20px;
  }

  .copyright {
    padding-top: 20px;
  }

  .form-panel {
    > .title {
      font-size: 28px;
    }

    > .subtitle {
      font-size: $font-size-sm;
    }

    > .form {
      margin-top: 20px;
    }

    > .field {
      gap: 6px;
    }
  }
}
</style>
