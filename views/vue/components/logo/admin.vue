<script setup lang="ts">
import { computed, useSlots } from "vue";

import { ADMIN_BRAND } from "@fe-constants/app";

const {
  name = ADMIN_BRAND.name,
  text = ADMIN_BRAND.text,
  icon = ADMIN_BRAND.icon,
  color = "currentColor",
  size = "md",
  position = "left",
  theme = "dark",
} = defineProps<{
  name?: string;
  text?: string;
  icon?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  position?: "left" | "center";
  theme?: "dark" | "light";
}>();

const slots = useSlots();

const hasIcon = computed(() => Boolean(icon || slots.icon));
const hasText = computed(() => Boolean(text || slots.text));
</script>

<template>
  <div
    :class="[
      'logo-admin',
      `-size-${size}`,
      `-${position}`,
      `-${theme}`,
      { '-with-icon': hasIcon },
    ]"
    :style="{ color }"
  >
    <span v-if="hasIcon" class="icon">
      <slot name="icon">
        <fa-icon :icon="icon!" />
      </slot>
    </span>

    <div class="label">
      <span class="name">{{ name }}</span>
      <span v-if="hasText" class="text">
        <slot name="text">{{ text }}</slot>
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.logo-admin {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-weight: $font-weight-bold;

  &.-left {
    justify-content: flex-start;
  }

  &.-center {
    justify-content: center;
  }

  &.-with-icon {
    gap: 12px;

    > .icon {
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: $radius-md;
    }

    > .label {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.3em 0.4em;
      min-width: 0;
    }
  }

  &.-dark.-with-icon > .icon {
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  }

  &.-light.-with-icon > .icon {
    background: rgba(22, 134, 217, 0.08);
    border: 1px solid rgba(22, 134, 217, 0.14);
    box-shadow: none;
  }

  > .label > .name {
    font-family: "logo";
    line-height: 1;
    letter-spacing: 0.01em;
  }

  > .label > .text {
    font-family: inherit;
    font-weight: $font-weight-default;
    line-height: 1.2;
    color: inherit;
    opacity: 0.82;
    letter-spacing: 0.02em;
  }

  &.-size-sm {
    > .label > .name {
      font-size: $font-size-xl;
    }

    > .label > .text {
      font-size: $font-size-sm;
    }

    &.-with-icon > .icon {
      width: 36px;
      height: 36px;
      font-size: 16px;
      border-radius: 10px;
    }
  }

  &.-size-md {
    > .label > .name {
      font-size: $font-size-xxl;
    }

    > .label > .text {
      font-size: $font-size-md;
    }

    &.-with-icon > .icon {
      width: 44px;
      height: 44px;
      font-size: 20px;
    }
  }

  &.-size-lg {
    &.-with-icon {
      gap: 16px;

      > .icon {
        width: 52px;
        height: 52px;
        font-size: 22px;
        border-radius: 14px;
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
