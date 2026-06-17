<script setup lang="ts">
import { computed } from "vue";

const {
  label,
  icon,
  color = "default",
  size = "md",
  bg = "white",
  variant = "outline",
  badge = 0,
  radius = "sm",
} = defineProps<{
  label?: string;
  icon?: string;
  badge?: number;
  variant?: "outline" | "filled";
  radius?: "sm" | "md" | "lg" | "full";
  color?:
    | "primary"
    | "secondary"
    | "danger"
    | "warning"
    | "info"
    | "success"
    | "default";
  size?: "sm" | "md" | "lg";
  bg?: string;
}>();

const isOnlyIcon = computed(() => !label && icon);
</script>

<template>
  <button
    :class="[
      'button-app',
      `-${color}`,
      `-size-${size}`,
      `-${variant}`,
      `-radius-${radius}`,
    ]"
  >
    <div
      v-wave
      :class="['wrapper', { '-only-icon': isOnlyIcon }]"
      :style="{ background: bg }"
    >
      <fa-icon v-if="icon" :icon="icon" class="icon" />
      <span v-if="label" class="label">{{ label }}</span>
      <span v-if="badge" class="badge">{{ badge }}</span>
    </div>
  </button>
</template>

<style scoped lang="scss">
.button-app {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: $radius-sm;
  border: 2px solid material-color(grey, 600);
  outline: none;
  cursor: pointer;
  &.-outline {
    border-color: material-color(grey, 600);
  }
  &.-radius-sm {
    border-radius: $radius-sm;
    > .wrapper {
      border-radius: $radius-sm;
    }
  }
  &.-radius-md {
    border-radius: $radius-md;
    > .wrapper {
      border-radius: $radius-md;
    }
  }
  &.-radius-lg {
    border-radius: $radius-lg;
    > .wrapper {
      border-radius: $radius-lg;
    }
  }
  &.-radius-full {
    border-radius: $radius-full;
    > .wrapper {
      border-radius: $radius-full;
    }
  }

  > .wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    height: 100%;
    padding: 8px 12px;
    color: material-color(grey, 600);
    position: relative;
    &.-only-icon {
      padding: 8px;
    }
  }
  > .wrapper > .label {
    font-weight: 600;
    color: material-color(grey, 600);
  }
  > .wrapper > .icon {
    color: material-color(grey, 600);
  }
  > .wrapper > .badge {
    position: absolute;
    top: -8px;
    right: -10px;
    background-color: $white;
    color: $red;
    padding: 1px 2px;
    border-radius: 5px;
    font-size: $font-size-sm;
    font-weight: 600;
    border: 2px solid $red;
  }
}

// size
.button-app.-size-sm > .wrapper {
  padding: $space-xs $space-sm;
  gap: $space-xs;
  > .label {
    font-size: $font-size-md;
  }
  > .icon {
    font-size: $font-size-md;
  }
}
.button-app.-size-md > .wrapper {
  padding: 10px 16px;
}
.button-app.-size-lg > .wrapper {
  padding: 12px 20px;
}

// color
.button-app.-primary {
  border-color: $active;
  > .wrapper,
  > .wrapper > .label,
  > .wrapper > .icon {
    color: $active;
  }
}

.button-app.-danger {
  border-color: $red;
  > .wrapper,
  > .wrapper > .label,
  > .wrapper > .icon {
    color: $red;
  }
}

.button-app.-warning {
  border-color: #ffb648;
  > .wrapper,
  > .wrapper > .label,
  > .wrapper > .icon {
    color: #ffb648;
  }
}

.button-app.-success {
  border-color: material-color(green, 500);
  > .wrapper,
  > .wrapper > .label,
  > .wrapper > .icon {
    color: material-color(green, 500);
  }
}
</style>
