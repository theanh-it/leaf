<script setup lang="ts">
import { uid } from "uid";
import { ref, watch, onUnmounted } from "vue";
import { useMedia } from "@fe-composables/media";
import { isBlob, createBlobImageUrl, resizeImage } from "@fe-helpers/file";

const { images = [] } = defineProps<{
  label?: string;
  images?: string[];
  error?: string;
  size?: string;
}>();

type ImageValue = string | File;
const model = defineModel<ImageValue[]>({ default: [] });

const addInputId = uid();
const replaceInputId = uid();

const { getLinkImage } = useMedia();

const localImages = ref<ImageValue[]>([]);
const replaceIndex = ref<number | null>(null);

const filePreviewMap = new WeakMap<File, string>();
const createdBlobUrls = new Set<string>();

const syncFromOutside = () => {
  if (model.value?.length) {
    localImages.value = [...model.value];
    return;
  }

  localImages.value = [...images];
  model.value = [...images];
};

watch(
  () => [images, model.value] as const,
  () => syncFromOutside(),
  { immediate: true, deep: true }
);

const getPreviewUrl = (image: ImageValue) => {
  if (typeof image === "string") {
    return isBlob(image) ? image : getLinkImage(image);
  }

  const exists = filePreviewMap.get(image);

  if (exists) return exists;

  const blobUrl = createBlobImageUrl(image);
  filePreviewMap.set(image, blobUrl);
  createdBlobUrls.add(blobUrl);

  return blobUrl;
};

const updateModel = (next: ImageValue[]) => {
  localImages.value = next;
  model.value = [...next];
};

const onAddImages = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];

  if (!files.length) return;

  const resizedFiles = (await Promise.all(
    files.map((file) => resizeImage(file) as Promise<File>)
  )) as File[];

  updateModel([...localImages.value, ...resizedFiles]);
  target.value = "";
};

const openReplaceImage = (index: number) => {
  replaceIndex.value = index;
  const input = document.getElementById(
    replaceInputId
  ) as HTMLInputElement | null;
  input?.click();
};

const onReplaceImage = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || replaceIndex.value === null) return;

  const resizedFile = (await resizeImage(file)) as File;
  const next = [...localImages.value];
  next[replaceIndex.value] = resizedFile;

  updateModel(next);
  replaceIndex.value = null;
  target.value = "";
};

const removeImage = (index: number) => {
  const next = [...localImages.value];
  next.splice(index, 1);
  updateModel(next);
};

onUnmounted(() => {
  createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
  createdBlobUrls.clear();
});
</script>

<template>
  <div class="admin-upload-images">
    <label v-if="label" class="label">{{ label }}:</label>
    <input
      v-show="false"
      :id="addInputId"
      type="file"
      multiple
      accept="image/*"
      @change="onAddImages"
    />
    <input
      v-show="false"
      :id="replaceInputId"
      type="file"
      accept="image/*"
      @change="onReplaceImage"
    />

    <label :for="addInputId" class="block-upload">
      <div class="placeholder">
        <fa-icon icon="plus" class="icon" style="font-size: 1.25rem" />
        <span class="text">Thêm ảnh</span>
      </div>
    </label>

    <div v-if="localImages.length" class="images-grid">
      <div
        v-for="(image, index) in localImages"
        :key="index"
        class="image-item"
      >
        <img :src="getPreviewUrl(image)" class="image" />
        <div class="actions">
          <button
            type="button"
            class="btn -edit"
            @click="openReplaceImage(index)"
          >
            <fa-icon icon="pen" />
            Sửa
          </button>
          <button type="button" class="btn -delete" @click="removeImage(index)">
            <fa-icon icon="trash" />
            Xóa
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.admin-upload-images {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  > .label {
    font-size: $font-size-md;
    font-weight: $font-weight-bold;
    color: $color-text;
  }
  > .block-upload {
    width: 100%;
    min-height: 70px;
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
  > .block-upload > .placeholder {
    display: flex;
    align-items: center;
    gap: $space-sm;
    background: rgba(0, 0, 0, 0.5);
    color: $white;
    border-radius: $radius-md;
    padding: $space-xs;
  }
  > .images-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: $space-sm;
  }
  > .images-grid > .image-item {
    border: $border-medium;
    border-radius: $radius-md;
    overflow: hidden;
    background: $white;
  }
  > .images-grid > .image-item > .image {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    display: block;
  }
  > .images-grid > .image-item > .actions {
    display: flex;
    gap: 8px;
    padding: 8px;
    border-top: 1px solid $color-border;
  }
  > .images-grid > .image-item > .actions > .btn {
    flex: 1;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: $radius-sm;
    border: 1px solid $color-border;
    background: $white;
    cursor: pointer;
    font-size: $font-size-sm;
  }
  > .images-grid > .image-item > .actions > .btn.-edit {
    color: $color-primary;
  }
  > .images-grid > .image-item > .actions > .btn.-delete {
    color: $color-error;
  }
  > .error {
    font-size: $font-size-sm;
    font-weight: $font-weight-default;
    color: $color-error;
  }
}
</style>
