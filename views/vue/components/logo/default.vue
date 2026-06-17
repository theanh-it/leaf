<script setup lang="ts">
import { computed, useId } from "vue";

import { SITE_BRAND } from "@fe-constants/app";

const {
  name = SITE_BRAND.name,
  text = SITE_BRAND.text,
  color = "#0f766e",
  size = "md",
  position = "left",
} = defineProps<{
  name?: string;
  text?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  position?: "left" | "center";
}>();

const gradientId = useId();

const hasText = computed(() => Boolean(text));
</script>

<template>
  <div
    :class="['logo-default', `-size-${size}`, `-${position}`]"
    :style="{ color }"
  >
    <span class="mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient :id="gradientId" x1="6" y1="4" x2="26" y2="28">
            <stop stop-color="#22c55e" />
            <stop offset="1" stop-color="#14b8a6" />
          </linearGradient>
        </defs>
        <path
          d="M16 4C16 4 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 4 16 4Z"
          :fill="`url(#${gradientId})`"
        />
        <path
          d="M16 8V24"
          stroke="rgba(255,255,255,0.85)"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </span>

    <div class="label">
      <span class="name">{{ name }}</span>
      <span v-if="hasText" class="text">{{ text }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.logo-default {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: $font-weight-bold;

  &.-left {
    justify-content: flex-start;
  }

  &.-center {
    justify-content: center;
  }

  > .mark {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      rgba(34, 197, 94, 0.12),
      rgba(20, 184, 166, 0.1)
    );
    border: 1px solid rgba(20, 184, 166, 0.18);

    > svg {
      display: block;
    }
  }

  > .label {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.3em 0.4em;
    min-width: 0;
  }

  > .label > .name {
    font-family: "logo";
    line-height: 1;
    letter-spacing: 0.02em;
  }

  > .label > .text {
    font-family: inherit;
    font-weight: $font-weight-default;
    opacity: 0.78;
    letter-spacing: 0.02em;
  }

  &.-size-sm {
    gap: 8px;

    > .mark {
      width: 34px;
      height: 34px;
      border-radius: 10px;

      > svg {
        width: 20px;
        height: 20px;
      }
    }

    > .label > .name {
      font-size: $font-size-xl;
    }

    > .label > .text {
      font-size: $font-size-sm;
    }
  }

  &.-size-md {
    > .mark {
      width: 42px;
      height: 42px;

      > svg {
        width: 24px;
        height: 24px;
      }
    }

    > .label > .name {
      font-size: $font-size-xxl;
    }

    > .label > .text {
      font-size: $font-size-md;
    }
  }

  &.-size-lg {
    gap: 14px;

    > .mark {
      width: 52px;
      height: 52px;
      border-radius: 14px;

      > svg {
        width: 30px;
        height: 30px;
      }
    }

    > .label > .name {
      font-size: 40px;
    }

    > .label > .text {
      font-size: $font-size-lg;
    }
  }
}
</style>
