<script setup lang="ts">
import { computed } from "vue";

const {
  position = "absolute",
  radius,
  color = "white",
} = defineProps<{
  type?: "default" | "linear";
  radius?: "lg" | "md" | "sm";
  color?: string;
  position?: "absolute" | "relative" | "fixed";
}>();

const text = defineModel<string>("text", { default: "" });

const radiusClass = computed(() => {
  return radius ? `-radius-${radius}` : "";
});

const colorClass = computed(() => {
  return color ? `-color-${color}` : "";
});

const positionClass = computed(() => {
  return position ? `-position-${position}` : "";
});
</script>
<template>
  <div v-if="!type" :class="`loading -default ${radiusClass} ${positionClass}`">
    <div :class="`loader -default ${colorClass}`"></div>
  </div>
  <div v-else :class="`loading -linear ${radiusClass} ${positionClass}`">
    <p v-if="text" class="text">{{ text }}</p>
    <div
      :class="`loader -linear linear-progress ${colorClass}`"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-busy="true"
    >
      <div class="linear-progress__track">
        <div class="linear-progress__bar" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading.-default {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: rgb(0 0 0 / 5%);
  z-index: 9999;
  &.-position-absolute {
    position: absolute;
  }
  &.-position-relative {
    position: relative;
  }
  &.-position-fixed {
    position: fixed;
  }
  &.-radius-lg {
    border-radius: $radius-lg;
  }
  &.-radius-md {
    border-radius: $radius-md;
  }
  &.-radius-sm {
    border-radius: $radius-sm;
  }
}
.loader.-default {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  border: 3px solid;
  border-color: $white $white transparent;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
  &.-color-white {
    border-color: $white $white transparent;
  }
  &.-color-orange {
    border-color: $color-warning $color-warning transparent;
  }
  &.-color-blue {
    border-color: $color-primary $color-primary transparent;
  }
  &.-color-green {
    border-color: $color-success $color-success transparent;
  }
  &.-color-yellow {
    border-color: #eab308 #eab308 transparent;
  }
  &.-color-purple {
    border-color: #a855f7 #a855f7 transparent;
  }
  &.-color-pink {
    border-color: #ec4899 #ec4899 transparent;
  }
  &.-color-brown {
    border-color: #92400e #92400e transparent;
  }
  &.-color-gray {
    border-color: $color-text-muted $color-text-muted transparent;
  }
  &.-color-active {
    border-color: $color-primary $color-primary transparent;
  }
}
.loader.-default::after {
  content: "";
  box-sizing: border-box;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  border: 3px solid;
  border-color: transparent $white $white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  animation: rotationBack 0.5s linear infinite;
  transform-origin: center center;
}

.loader.-default {
  &.-color-white::after {
    border-color: transparent $white $white;
  }
  &.-color-orange::after {
    border-color: transparent $color-warning $color-warning;
  }
  &.-color-blue::after {
    border-color: transparent $color-primary $color-primary;
  }
  &.-color-green::after {
    border-color: transparent $color-success $color-success;
  }
  &.-color-yellow::after {
    border-color: transparent #eab308 #eab308;
  }
  &.-color-purple::after {
    border-color: transparent #a855f7 #a855f7;
  }
  &.-color-pink::after {
    border-color: transparent #ec4899 #ec4899;
  }
  &.-color-brown::after {
    border-color: transparent #92400e #92400e;
  }
  &.-color-gray::after {
    border-color: transparent $color-text-muted $color-text-muted;
  }
  &.-color-active::after {
    border-color: transparent $color-primary $color-primary;
  }
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes rotationBack {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}

.loading.-linear {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 20px;
  z-index: 9999;
  > .text {
    color: $color-warning;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }
}

/* Thanh tiến trình indeterminate (thay VProgressLinear) */
.loader.-linear.linear-progress {
  width: 100%;
  max-width: 100%;
  min-height: 5px;
}

.linear-progress__track {
  width: 100%;
  height: 5px;
  border-radius: $radius-full;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.08);
}

.linear-progress__bar {
  height: 100%;
  width: 40%;
  border-radius: $radius-full;
  background-color: $color-primary;
  transform-origin: left center;
  animation: linear-indeterminate 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes linear-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(200%);
  }
  100% {
    transform: translateX(500%);
  }
}

.loader.-linear {
  &.-color-white .linear-progress__bar {
    background-color: $white;
  }
  &.-color-orange .linear-progress__bar {
    background-color: $color-warning;
  }
  &.-color-blue .linear-progress__bar {
    background-color: $color-primary;
  }
  &.-color-green .linear-progress__bar {
    background-color: $color-success;
  }
  &.-color-yellow .linear-progress__bar {
    background-color: #eab308;
  }
  &.-color-purple .linear-progress__bar {
    background-color: #a855f7;
  }
  &.-color-pink .linear-progress__bar {
    background-color: #ec4899;
  }
  &.-color-brown .linear-progress__bar {
    background-color: #92400e;
  }
  &.-color-gray .linear-progress__bar {
    background-color: $color-text-muted;
  }
  &.-color-active .linear-progress__bar {
    background-color: $color-primary;
  }
}
</style>
