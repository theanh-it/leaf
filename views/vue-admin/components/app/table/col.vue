<script setup lang="ts">
import { ref, computed } from "vue";

import { useMedia } from "@fe-admin/composables/media";
import { formatTime, numberFormat } from "@fe-admin/utils/index";

const { getLinkImage } = useMedia();

const { type = "string", value } = defineProps<{
  type?: "string" | "number" | "date" | "image" | string;
  value?: any;
}>();

const isFullScreen = ref(false);

const toggleFullScreen = () => (isFullScreen.value = !isFullScreen.value);

const isArray = computed(() => Array.isArray(value));
</script>

<template>
  <td v-if="isArray">
    <div class="col">({{ value.join(" - ") }})</div>
  </td>
  <td v-else>
    <div class="col" v-if="type === 'number'">
      {{ numberFormat(value) }}
    </div>
    <div class="col" v-else-if="type === 'date'">
      {{ formatTime(value) }}
    </div>
    <div class="col" v-else-if="type === 'image'" @click="toggleFullScreen">
      <img :src="getLinkImage(value)" class="img" />
      <div class="full-screen-overlay" v-if="isFullScreen">
        <img :src="getLinkImage(value)" class="img" />
      </div>
    </div>
    <div class="col" v-else>
      {{ value }}
    </div>
  </td>
</template>

<style scoped lang="scss">
td {
  padding: $space-sm $space-md;
  border-bottom: 1px solid $color-border;
}

.col {
  display: flex;
  > img {
    max-height: 40px;
    min-height: 40px;
    cursor: pointer;
    border-radius: $radius-sm;
  }
}

.full-screen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
  padding: $space-md;
  > img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}
</style>
