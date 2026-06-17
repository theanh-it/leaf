<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

import { ADMIN_BRAND } from "@fe-constants/app";

const messages = [
  "Đang tải cấu hình hệ thống...",
  "Đang chuẩn bị giao diện...",
];

const currentMessage = ref(messages[0]);
let messageIndex = 0;
let messageTimer: ReturnType<typeof setInterval>;

onMounted(() => {
  messageTimer = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    currentMessage.value = messages[messageIndex];
  }, 2400);
});

onUnmounted(() => {
  clearInterval(messageTimer);
});
</script>

<template>
  <div
    class="loading-app"
    role="status"
    aria-live="polite"
    aria-label="Đang tải"
  >
    <div class="panel">
      <div class="spinner" aria-hidden="true">
        <span class="glow"></span>
        <span class="ring"></span>
        <span class="ring -outer"></span>
        <span class="spinner-icon">
          <fa-icon :icon="ADMIN_BRAND.icon" />
        </span>
      </div>

      <p class="brand-name">Leaf</p>

      <div class="status">
        <p class="title">Website đang được khởi tạo</p>
        <p class="text">
          <Transition name="message" mode="out-in">
            <span :key="currentMessage">{{ currentMessage }}</span>
          </Transition>
        </p>
        <div class="dots" aria-hidden="true">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.loading-app {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-lg;
  // background: rgba(244, 249, 255, 0.88);
  background: $white;
  backdrop-filter: blur(8px);
}

.panel {
  width: min(100%, 340px);
  padding: 34px 28px 28px;
  border-radius: 20px;
  background: $white;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.spinner {
  position: relative;
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
}

.glow {
  position: absolute;
  inset: 6px;
  border-radius: $radius-full;
  background: radial-gradient(
    circle,
    rgba(22, 134, 217, 0.22) 0%,
    rgba(22, 134, 217, 0) 70%
  );
  animation: glow 2s ease-in-out infinite;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: $radius-full;
  border: 2px solid #e5e7eb;
  border-top-color: #1686d9;
  border-right-color: rgba(22, 134, 217, 0.35);
  animation: spin 0.9s linear infinite;

  &.-outer {
    inset: -6px;
    border-width: 1.5px;
    border-top-color: #1f9f9a;
    border-right-color: rgba(31, 159, 154, 0.25);
    opacity: 0.7;
    animation-duration: 1.4s;
    animation-direction: reverse;
  }
}

.spinner-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(22, 134, 217, 0.08);
  color: #0f6fb8;
  font-size: 18px;
  animation: icon-pulse 1.8s ease-in-out infinite;
}

.brand-name {
  margin: 0;
  font-family: "logo";
  font-size: $font-size-lg;
  color: #0f6fb8;
  letter-spacing: 0.04em;
}

.status {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.title {
  margin: 0;
  color: #1f2937;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
}

.text {
  margin: 0;
  min-height: 20px;
  font-size: $font-size-sm;
  color: #6b7280;
  line-height: 1.5;
}

.dots {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: $radius-full;
  background: linear-gradient(180deg, #1686d9, #1f9f9a);
  animation: dot-bounce 1.2s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.15s;
  }

  &:nth-child(3) {
    animation-delay: 0.3s;
  }
}

.message-enter-active,
.message-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.95);
  }

  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes icon-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.06);
  }
}

@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .loading-app {
    padding: $space-md;
  }

  .panel {
    padding: 28px 22px 24px;
    gap: 12px;
  }
}
</style>
