<script setup lang="ts">
import { uid } from "uid";
import { ref, computed } from "vue";
import { useMedia } from "@fe-composables/media";
import { isBlob, createBlobImageUrl, resizeImage } from "@fe-helpers/file";

const { image = "", size = "236px" } = defineProps<{
  label?: string;
  image?: string;
  error?: string;
  size?: string;
}>();

const model = defineModel<any>();

const inputId = uid();

const { getLinkImage } = useMedia();

const blobUrl = ref<string>("");
const previewUrl = computed(() => blobUrl.value || image);
const isBlobUrl = computed(() => isBlob(previewUrl.value));

const onChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  const resizedFile = (await resizeImage(file)) as File;

  model.value = resizedFile;
  blobUrl.value = createBlobImageUrl(resizedFile);
};
</script>

<template>
  <div class="admin-upload-image">
    <label v-if="label" class="label">{{ label }}:</label>
    <input v-show="false" :id="inputId" type="file" @change="onChange" />
    <label :for="inputId" class="block-upload">
      <img
        v-if="previewUrl"
        :src="isBlobUrl ? previewUrl : getLinkImage(previewUrl)"
        class="image"
      />
      <div v-if="previewUrl" class="placeholder">
        <fa-icon icon="pen" class="icon" style="font-size: 1.25rem" />
        <span class="text">Đổi ảnh</span>
      </div>
      <div v-else class="placeholder">
        <fa-icon icon="plus" class="icon" style="font-size: 1.25rem" />
        <span class="text">Chọn ảnh</span>
      </div>
    </label>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.admin-upload-image {
  width: 100%;
  display: flex;
  max-width: v-bind(size);
  min-height: 200px;
  max-height: v-bind(size);
  flex-direction: column;
  gap: $space-sm;
  > .label {
    font-size: $font-size-md;
    font-weight: $font-weight-bold;
    color: $color-text;
  }
  > .block-upload {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-medium;
    border-radius: $radius-md;
    padding: $space-sm;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: $time-fast;
  }
  > .block-upload:hover {
    border-color: $color-primary;
  }
  > .block-upload > .image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  > .block-upload > .placeholder {
    position: absolute;
    display: flex;
    align-items: center;
    gap: $space-sm;
    background: rgba(0, 0, 0, 0.5);
    color: $white;
    border-radius: $radius-md;
    padding: $space-xs;
  }
  > .error {
    font-size: $font-size-sm;
    font-weight: $font-weight-default;
    color: $color-error;
  }
}
</style>
